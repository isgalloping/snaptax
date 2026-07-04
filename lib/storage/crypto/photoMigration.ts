import { encryptBuffer } from "@/lib/storage/crypto/aesGcm";
import { getOrCreateDek } from "@/lib/storage/crypto/keyManager";
import {
  loadEncryptedPhoto,
  PHOTO_CIPHER_VERSION,
  PHOTOS_STORE,
  saveEncryptedPhoto,
  type EncryptedPhotoRow,
} from "@/lib/storage/crypto/photoStore";
import {
  IDB_LEGACY_CRYPTO_META,
  IDB_STORE_CRYPTO_META,
  IDB_STORE_SYSTEM_META,
  IDB_LEGACY_SYSTEM_META,
} from "@/lib/storage/idbStores";
import { getPhotoMeta } from "@/lib/storage/photoMetadata";
import { isOpfsAvailable } from "@/lib/storage/opfs/photoFiles";
import { hasMigratedPhotoPayload } from "@/lib/storage/photoTypes";

export const PHOTO_OPFS_MIGRATION_KEY = "photo_opfs_migration_v1";
export type PhotoOpfsMigrationState = "pending" | "done";

const MIGRATION_FLAG = "photo_cipher_migrated";

type LegacyPhotoRow = {
  id: string;
  blob?: Blob;
  v?: number;
  ct?: ArrayBuffer;
};

function cryptoMetaStoreName(db: IDBDatabase): string {
  if (db.objectStoreNames.contains(IDB_STORE_CRYPTO_META)) {
    return IDB_STORE_CRYPTO_META;
  }
  return IDB_LEGACY_CRYPTO_META;
}

function systemMetaStoreName(db: IDBDatabase): string {
  if (db.objectStoreNames.contains(IDB_STORE_SYSTEM_META)) {
    return IDB_STORE_SYSTEM_META;
  }
  return IDB_LEGACY_SYSTEM_META;
}

async function readSystemMetaValue<T>(
  db: IDBDatabase,
  key: string,
): Promise<T | null> {
  const store = systemMetaStoreName(db);
  if (!db.objectStoreNames.contains(store)) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const row = request.result as { key: string; value: T } | undefined;
      resolve(row?.value ?? null);
    };
  });
}

async function writeSystemMetaValue<T>(
  db: IDBDatabase,
  key: string,
  value: T,
): Promise<void> {
  const store = systemMetaStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const request = tx.objectStore(store).put({ key, value });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function readCipherMigrationFlag(db: IDBDatabase): Promise<boolean> {
  const store = cryptoMetaStoreName(db);
  if (!db.objectStoreNames.contains(store)) return true;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).get(MIGRATION_FLAG);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result?.done === true);
  });
}

async function writeCipherMigrationFlag(db: IDBDatabase): Promise<void> {
  const store = cryptoMetaStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const request = tx
      .objectStore(store)
      .put({ id: MIGRATION_FLAG, done: true });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function readLegacyPlainPhotos(db: IDBDatabase): Promise<LegacyPhotoRow[]> {
  if (!db.objectStoreNames.contains(PHOTOS_STORE)) return Promise.resolve([]);
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

function writeEncryptedRows(
  db: IDBDatabase,
  rows: EncryptedPhotoRow[],
): Promise<void> {
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
  const store = cryptoMetaStoreName(db);
  if (!db.objectStoreNames.contains(store)) return;
  if (await readCipherMigrationFlag(db)) return;

  const legacy = await readLegacyPlainPhotos(db);
  if (legacy.length === 0) {
    await writeCipherMigrationFlag(db);
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
  await writeCipherMigrationFlag(db);
}

function readLegacyEncryptedPhotos(db: IDBDatabase): Promise<LegacyPhotoRow[]> {
  if (!db.objectStoreNames.contains(PHOTOS_STORE)) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const request = tx.objectStore(PHOTOS_STORE).getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const rows = (request.result as LegacyPhotoRow[]) ?? [];
      resolve(
        rows.filter(
          (row) => row.v === PHOTO_CIPHER_VERSION && row.ct instanceof ArrayBuffer,
        ),
      );
    };
  });
}

async function hasUnmigratedLegacyPhotos(db: IDBDatabase): Promise<boolean> {
  const legacy = await readLegacyEncryptedPhotos(db);
  for (const row of legacy) {
    if (!hasMigratedPhotoPayload(await getPhotoMeta(db, row.id))) return true;
  }
  return false;
}

async function purgeMigratedLegacyBlobs(db: IDBDatabase): Promise<void> {
  if (!db.objectStoreNames.contains(PHOTOS_STORE)) return;
  const remaining = await readLegacyEncryptedPhotos(db);
  for (const row of remaining) {
    if (!hasMigratedPhotoPayload(await getPhotoMeta(db, row.id))) continue;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PHOTOS_STORE, "readwrite");
      tx.objectStore(PHOTOS_STORE).delete(row.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export async function migrateLegacyPhotosToOpfs(db: IDBDatabase): Promise<void> {
  if (!isOpfsAvailable()) return;
  const state = await readSystemMetaValue<PhotoOpfsMigrationState>(
    db,
    PHOTO_OPFS_MIGRATION_KEY,
  );
  const unmigrated = await hasUnmigratedLegacyPhotos(db);
  if (state === "done" && !unmigrated) {
    await purgeMigratedLegacyBlobs(db);
    return;
  }

  const legacy = await readLegacyEncryptedPhotos(db);
  for (const row of legacy) {
    if (hasMigratedPhotoPayload(await getPhotoMeta(db, row.id))) continue;
    const blob = await loadEncryptedPhoto(db, row.id);
    if (!blob) continue;
    await saveEncryptedPhoto(db, row.id, blob);
  }

  await purgeMigratedLegacyBlobs(db);
  await writeSystemMetaValue(db, PHOTO_OPFS_MIGRATION_KEY, "done");
}
