import { encryptBuffer } from "@/lib/storage/crypto/aesGcm";
import { getOrCreateDek } from "@/lib/storage/crypto/keyManager";
import {
  PHOTO_CIPHER_VERSION,
  PHOTOS_STORE,
  type EncryptedPhotoRow,
} from "@/lib/storage/crypto/photoStore";

const MIGRATION_FLAG = "photo_cipher_migrated";

type LegacyPhotoRow = {
  id: string;
  blob?: Blob;
};

async function readMigrationFlag(db: IDBDatabase): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("meta", "readonly");
    const request = tx.objectStore("meta").get(MIGRATION_FLAG);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result?.done === true);
  });
}

async function writeMigrationFlag(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("meta", "readwrite");
    const request = tx.objectStore("meta").put({ id: MIGRATION_FLAG, done: true });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function readLegacyPhotos(db: IDBDatabase): Promise<LegacyPhotoRow[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const request = tx.objectStore(PHOTOS_STORE).getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const rows = (request.result as LegacyPhotoRow[]) ?? [];
      resolve(rows.filter((row) => row.blob instanceof Blob));
    };
  });
}

function writeEncryptedRows(db: IDBDatabase, rows: EncryptedPhotoRow[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    const store = tx.objectStore(PHOTOS_STORE);
    for (const row of rows) {
      store.put(row);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function migrateLegacyPlainPhotos(db: IDBDatabase): Promise<void> {
  if (!db.objectStoreNames.contains("meta")) return;
  if (await readMigrationFlag(db)) return;

  const legacy = await readLegacyPhotos(db);
  if (legacy.length === 0) {
    await writeMigrationFlag(db);
    return;
  }

  const dek = await getOrCreateDek(db);
  const encrypted: EncryptedPhotoRow[] = [];
  for (const row of legacy) {
    const blob = row.blob!;
    const plaintext = await blob.arrayBuffer();
    const { iv, ct } = await encryptBuffer(dek, plaintext);
    encrypted.push({
      id: row.id,
      v: PHOTO_CIPHER_VERSION,
      alg: "AES-GCM",
      iv,
      ct,
      mime: blob.type || "image/jpeg",
      byteLength: plaintext.byteLength,
    });
  }

  await writeEncryptedRows(db, encrypted);
  await writeMigrationFlag(db);
}
