import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPhotoMeta } from "@/lib/storage/photoMetadata";
import {
  markPhotoRemoteSynced,
  PHOTO_CIPHER_VERSION,
  PHOTOS_STORE,
  type EncryptedPhotoRow,
} from "@/lib/storage/crypto/photoStore";
import {
  clearAllLocalData,
  warmReceiptDb,
} from "@/lib/storage/receiptDb";

function putLegacyEncryptedPhoto(
  db: IDBDatabase,
  row: EncryptedPhotoRow,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    tx.objectStore(PHOTOS_STORE).put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

describe("markPhotoRemoteSynced", () => {
  it("does not replace legacy photo bytes with unreadable metadata", async () => {
    await clearAllLocalData();
    const db = await warmReceiptDb();
    await putLegacyEncryptedPhoto(db, {
      id: "legacy-photo",
      v: PHOTO_CIPHER_VERSION,
      alg: "AES-GCM",
      iv: new Uint8Array([1, 2, 3]).buffer,
      ct: new Uint8Array([4, 5, 6]).buffer,
      mime: "image/jpeg",
      byteLength: 3,
    });

    await markPhotoRemoteSynced(db, "legacy-photo", 1_779_753_600_000);

    assert.equal(await getPhotoMeta(db, "legacy-photo"), null);
    await clearAllLocalData();
  });
});
