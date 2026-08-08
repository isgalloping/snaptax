import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterTombstonedReceipts,
  hasLocalPhoto,
  restoreReceiptsFromCloud,
} from "./cloudRestoreFlow.ts";
import { putPhotoMeta } from "@/lib/storage/photoMetadata";
import {
  clearAllLocalData,
  warmReceiptDb,
} from "@/lib/storage/receiptDb";
import {
  PHOTO_META_VERSION,
  type ReceiptPhotoMeta,
} from "@/lib/storage/photoTypes";
import type { ApiReceipt } from "./receiptApi.ts";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

const TOMBSTONED = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const KEPT = "550e8400-e29b-41d4-a716-446655440000";

function apiReceipt(id: string): ApiReceipt {
  return {
    id,
    status: "done",
    amount: 10,
    merchant: "A",
    category: null,
    taxAmount: 2,
    dataRegion: "us",
    capturedAt: "2026-06-14T12:00:00.000Z",
    updatedAt: "2026-06-14T12:00:00.000Z",
    taxSeason: null,
    taxSeasonDate: null,
    hasImage: true,
  };
}

function storedReceipt(id: string): StoredReceipt {
  const timestamp = new Date("2026-06-14T12:00:00.000Z");
  return {
    id,
    status: "done",
    amount: 10,
    merchant: "A",
    category: undefined,
    taxAmount: 2,
    dataRegion: "us",
    timestamp,
    updatedAt: timestamp,
    hasRemoteImage: true,
    pendingUpload: false,
  };
}

function photoMeta(
  id: string,
  overrides: Partial<ReceiptPhotoMeta> = {},
): ReceiptPhotoMeta {
  return {
    id,
    v: PHOTO_META_VERSION,
    mime: "image/jpeg",
    width: 1280,
    height: 960,
    byteLength: 250_000,
    thumbWidth: 480,
    thumbHeight: 360,
    thumbByteLength: 32_000,
    opfsFullPath: `snaptax/photos/${id}/full.v1.enc`,
    opfsThumbPath: `snaptax/photos/${id}/thumb.v1.enc`,
    fullIvB64: "full-iv",
    thumbIvB64: "thumb-iv",
    cipher: { alg: "AES-GCM", v: 1 },
    ...overrides,
  };
}

describe("filterTombstonedReceipts", () => {
  it("excludes tombstoned ids from merge list", () => {
    const receipts = [apiReceipt(TOMBSTONED), apiReceipt(KEPT)];
    const filtered = filterTombstonedReceipts(
      receipts,
      new Set([TOMBSTONED]),
    );

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.id, KEPT);
  });

  it("returns empty when all ids are tombstoned", () => {
    const receipts = [apiReceipt(TOMBSTONED)];
    const filtered = filterTombstonedReceipts(
      receipts,
      new Set([TOMBSTONED]),
    );

    assert.deepEqual(filtered, []);
  });

  it("can limit image restore candidates to receipts returned by the current sync", () => {
    const staleLocal = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    const receipts = [apiReceipt(staleLocal), apiReceipt(KEPT)];
    const filtered = filterTombstonedReceipts(receipts, new Set(), {
      includeIds: new Set([KEPT]),
    });

    assert.deepEqual(
      filtered.map((r) => r.id),
      [KEPT],
    );
  });
});

describe("restoreReceiptsFromCloud", () => {
  it("does not download images for stale local receipts absent from the current sync", async () => {
    const staleLocal = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    const downloadedIds: string[] = [];
    let localRows = [storedReceipt(staleLocal)];

    await restoreReceiptsFromCloud(
      { downloadImages: true },
      {
        fetchReceiptSyncPage: async () => ({
          receipts: [apiReceipt(KEPT)],
          nextCursor: null,
          hasMore: false,
        }),
        readDeletedReceiptIds: async () => new Set(),
        loadAllReceipts: async () => localRows,
        persistMergedReceipts: async (merged) => {
          localRows = merged;
        },
        hasLocalPhoto: async () => false,
        downloadReceiptImage: async (id) => {
          if (id === staleLocal) throw new Error("STALE_IMAGE_REQUESTED");
          downloadedIds.push(id);
        },
        warmReceiptDb: async () => ({} as IDBDatabase),
        rebuildCurrentSeasonSummary: async () => {},
      },
    );

    assert.deepEqual(downloadedIds, [KEPT]);
  });
});

describe("hasLocalPhoto", () => {
  it("treats purged full-photo meta as missing so restore redownloads it", async () => {
    await clearAllLocalData();
    const db = await warmReceiptDb();
    await putPhotoMeta(
      db,
      photoMeta(KEPT, {
        fullPurged: true,
        fullPurgedAtMs: Date.UTC(2026, 5, 30),
      }),
    );
    assert.equal(await hasLocalPhoto(KEPT), false);
    await clearAllLocalData();
  });

  it("treats orphan full-photo meta without OPFS bytes as missing", async () => {
    await clearAllLocalData();
    const db = await warmReceiptDb();
    await putPhotoMeta(db, photoMeta(KEPT));

    assert.equal(await hasLocalPhoto(KEPT), false);
    await clearAllLocalData();
  });
});
