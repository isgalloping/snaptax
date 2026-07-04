import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasMigratedPhotoPayload,
  PHOTO_META_VERSION,
  type ReceiptPhotoMeta,
} from "@/lib/storage/photoTypes";

function meta(overrides: Partial<ReceiptPhotoMeta> = {}): ReceiptPhotoMeta {
  return {
    id: "receipt-1",
    v: PHOTO_META_VERSION,
    mime: "image/jpeg",
    width: 1280,
    height: 960,
    byteLength: 250_000,
    thumbWidth: 480,
    thumbHeight: 360,
    thumbByteLength: 32_000,
    opfsFullPath: "snaptax/photos/receipt-1/full.v1.enc",
    opfsThumbPath: "snaptax/photos/receipt-1/thumb.v1.enc",
    fullIvB64: "full-iv",
    thumbIvB64: "thumb-iv",
    cipher: { alg: "AES-GCM", v: 1 },
    ...overrides,
  };
}

describe("hasMigratedPhotoPayload", () => {
  it("rejects remote-synced placeholder meta without OPFS payload", () => {
    assert.equal(
      hasMigratedPhotoPayload(
        meta({
          width: 0,
          height: 0,
          thumbWidth: 0,
          thumbHeight: 0,
          opfsFullPath: "snaptax/photos/receipt-1/full.v1.enc",
          opfsThumbPath: "snaptax/photos/receipt-1/thumb.v1.enc",
          fullIvB64: "",
          thumbIvB64: "",
          fullPurged: true,
          remoteSyncedAtMs: Date.UTC(2026, 5, 30),
        }),
      ),
      false,
    );
  });

  it("accepts valid thumb-only meta after full photo retention purge", () => {
    assert.equal(
      hasMigratedPhotoPayload(
        meta({
          fullPurged: true,
          fullPurgedAtMs: Date.UTC(2026, 5, 30),
        }),
      ),
      true,
    );
  });
});
