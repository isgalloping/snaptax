import {
  IDB_LEGACY_CRYPTO_META,
  IDB_STORE_CRYPTO_META,
} from "@/lib/storage/idbStores";

const DEK_KEY = "dek";

type DekMetaRecord = {
  id: typeof DEK_KEY;
  version: 1;
  dek: CryptoKey;
  createdAt: string;
};

function cryptoMetaStoreName(db: IDBDatabase): string {
  if (db.objectStoreNames.contains(IDB_STORE_CRYPTO_META)) {
    return IDB_STORE_CRYPTO_META;
  }
  return IDB_LEGACY_CRYPTO_META;
}

export async function getOrCreateDek(db: IDBDatabase): Promise<CryptoKey> {
  const existing = await readDekMeta(db);
  if (existing) return existing.dek;
  const dek = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  await writeDekMeta(db, {
    id: DEK_KEY,
    version: 1,
    dek,
    createdAt: new Date().toISOString(),
  });
  return dek;
}

export async function clearDek(db: IDBDatabase): Promise<void> {
  const store = cryptoMetaStoreName(db);
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(store)) {
      resolve();
      return;
    }
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(DEK_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function readDekMeta(db: IDBDatabase): Promise<DekMetaRecord | null> {
  const store = cryptoMetaStoreName(db);
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(store)) {
      resolve(null);
      return;
    }
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).get(DEK_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve((request.result as DekMetaRecord | undefined) ?? null);
    };
  });
}

function writeDekMeta(db: IDBDatabase, record: DekMetaRecord): Promise<void> {
  const store = cryptoMetaStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const request = tx.objectStore(store).put(record);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/** @deprecated Use IDB_STORE_CRYPTO_META from idbStores */
export const CRYPTO_META_STORE = IDB_LEGACY_CRYPTO_META;
