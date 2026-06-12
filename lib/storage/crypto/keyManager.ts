const META_STORE = "meta";
const DEK_KEY = "dek";

type DekMetaRecord = {
  id: typeof DEK_KEY;
  version: 1;
  dek: CryptoKey;
  createdAt: string;
};

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
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(META_STORE)) {
      resolve();
      return;
    }
    const tx = db.transaction(META_STORE, "readwrite");
    tx.objectStore(META_STORE).delete(DEK_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function readDekMeta(db: IDBDatabase): Promise<DekMetaRecord | null> {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(META_STORE)) {
      resolve(null);
      return;
    }
    const tx = db.transaction(META_STORE, "readonly");
    const request = tx.objectStore(META_STORE).get(DEK_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve((request.result as DekMetaRecord | undefined) ?? null);
    };
  });
}

function writeDekMeta(db: IDBDatabase, record: DekMetaRecord): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readwrite");
    const request = tx.objectStore(META_STORE).put(record);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export const CRYPTO_META_STORE = META_STORE;
