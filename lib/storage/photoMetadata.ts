import {
  IDB_LEGACY_PHOTOS,
  IDB_STORE_RECEIPT_PHOTOS,
} from "@/lib/storage/idbStores";
import type { ReceiptPhotoMeta } from "@/lib/storage/photoTypes";

function photoMetaStoreName(db: IDBDatabase): string {
  if (db.objectStoreNames.contains(IDB_STORE_RECEIPT_PHOTOS)) {
    return IDB_STORE_RECEIPT_PHOTOS;
  }
  return IDB_LEGACY_PHOTOS;
}

export async function putPhotoMeta(
  db: IDBDatabase,
  meta: ReceiptPhotoMeta,
): Promise<void> {
  const store = photoMetaStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const request = tx.objectStore(store).put(meta);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getPhotoMeta(
  db: IDBDatabase,
  id: string,
): Promise<ReceiptPhotoMeta | null> {
  const store = photoMetaStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const row = request.result as ReceiptPhotoMeta | undefined;
      resolve(row?.v === 2 ? row : null);
    };
  });
}

export async function deletePhotoMeta(
  db: IDBDatabase,
  id: string,
): Promise<void> {
  const store = photoMetaStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listPhotoMetaForRetention(
  db: IDBDatabase,
): Promise<ReceiptPhotoMeta[]> {
  const store = photoMetaStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const rows = (request.result as ReceiptPhotoMeta[]) ?? [];
      resolve(
        rows.filter(
          (r) =>
            r.v === 2 && r.remoteSyncedAtMs != null && r.fullPurged !== true,
        ),
      );
    };
  });
}
