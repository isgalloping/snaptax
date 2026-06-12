import { decryptBuffer, encryptBuffer } from "@/lib/storage/crypto/aesGcm";
import { getOrCreateDek } from "@/lib/storage/crypto/keyManager";

export const PHOTOS_STORE = "photos";
export const PHOTO_CIPHER_VERSION = 1 as const;

export type EncryptedPhotoRow = {
  id: string;
  v: typeof PHOTO_CIPHER_VERSION;
  alg: "AES-GCM";
  iv: ArrayBuffer;
  ct: ArrayBuffer;
  mime: string;
  byteLength: number;
};

type LegacyPhotoRow = {
  id: string;
  blob?: Blob;
};

function mimeForBlob(file: File | Blob): string {
  if (file.type) return file.type;
  return "image/jpeg";
}

export async function saveEncryptedPhoto(
  db: IDBDatabase,
  id: string,
  file: File | Blob,
): Promise<void> {
  const dek = await getOrCreateDek(db);
  const plaintext = await file.arrayBuffer();
  const { iv, ct } = await encryptBuffer(dek, plaintext);
  const row: EncryptedPhotoRow = {
    id,
    v: PHOTO_CIPHER_VERSION,
    alg: "AES-GCM",
    iv,
    ct,
    mime: mimeForBlob(file),
    byteLength: plaintext.byteLength,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    const request = tx.objectStore(PHOTOS_STORE).put(row);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function loadEncryptedPhoto(
  db: IDBDatabase,
  id: string,
): Promise<Blob | null> {
  const row = await readPhotoRow(db, id);
  if (!row) return null;
  if ("blob" in row && row.blob) {
    return row.blob;
  }
  if (!isEncryptedPhotoRow(row)) return null;
  const dek = await getOrCreateDek(db);
  const plaintext = await decryptBuffer(dek, row.iv, row.ct);
  return new Blob([plaintext], { type: row.mime });
}

export async function deleteEncryptedPhoto(
  db: IDBDatabase,
  id: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    tx.objectStore(PHOTOS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function readPhotoRow(
  db: IDBDatabase,
  id: string,
): Promise<EncryptedPhotoRow | LegacyPhotoRow | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const request = tx.objectStore(PHOTOS_STORE).get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve(
        (request.result as EncryptedPhotoRow | LegacyPhotoRow | undefined) ??
          null,
      );
    };
  });
}

function isEncryptedPhotoRow(
  row: EncryptedPhotoRow | LegacyPhotoRow,
): row is EncryptedPhotoRow {
  return (
    typeof row === "object" &&
    row != null &&
    "v" in row &&
    row.v === PHOTO_CIPHER_VERSION &&
    "ct" in row
  );
}
