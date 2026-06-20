import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canPurgePhotoFullForReceipt,
  PHOTO_FULL_RETENTION_MS,
  shouldPurgePhotoFull,
} from "@/lib/client/photoRetention";
import type { ReceiptPhotoMeta } from "@/lib/storage/photoTypes";

function meta(
  overrides: Partial<ReceiptPhotoMeta> = {},
): ReceiptPhotoMeta {
  return {
    id: "r1",
    v: 2,
    mime: "image/jpeg",
    width: 1280,
    height: 960,
    byteLength: 250_000,
    thumbWidth: 480,
    thumbHeight: 360,
    thumbByteLength: 50_000,
    opfsFullPath: "snaptax/photos/r1/full.v1.enc",
    opfsThumbPath: "snaptax/photos/r1/thumb.v1.enc",
    fullIvB64: "abc",
    thumbIvB64: "def",
    cipher: { alg: "AES-GCM", v: 1 },
    ...overrides,
  };
}

describe("shouldPurgePhotoFull", () => {
  it("purges when synced more than 90 days ago", () => {
    const now = Date.UTC(2026, 5, 1);
    const synced = now - PHOTO_FULL_RETENTION_MS - 1;
    assert.equal(shouldPurgePhotoFull(meta({ remoteSyncedAtMs: synced }), now), true);
  });

  it("keeps when synced within 90 days", () => {
    const now = Date.UTC(2026, 5, 1);
    const synced = now - PHOTO_FULL_RETENTION_MS + 86_400_000;
    assert.equal(shouldPurgePhotoFull(meta({ remoteSyncedAtMs: synced }), now), false);
  });

  it("never purges when already purged or unsynced", () => {
    const now = Date.UTC(2026, 5, 1);
    assert.equal(
      shouldPurgePhotoFull(meta({ fullPurged: true, remoteSyncedAtMs: 0 }), now),
      false,
    );
    assert.equal(shouldPurgePhotoFull(meta({ remoteSyncedAtMs: undefined }), now), false);
  });
});

describe("canPurgePhotoFullForReceipt", () => {
  it("blocks pending upload and processing", () => {
    assert.equal(
      canPurgePhotoFullForReceipt({
        id: "r1",
        pendingUpload: true,
        status: "done",
      }),
      false,
    );
    assert.equal(
      canPurgePhotoFullForReceipt({ id: "r1", status: "processing" }),
      false,
    );
    assert.equal(
      canPurgePhotoFullForReceipt({ id: "r1", status: "done" }),
      true,
    );
  });
});
