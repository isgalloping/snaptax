import {
  IDB_LEGACY_CRYPTO_META,
  IDB_LEGACY_DB_NAME,
  IDB_LEGACY_PHOTOS,
  IDB_LEGACY_RECEIPTS,
  IDB_LEGACY_SYSTEM_META,
  IDB_STORE_CRYPTO_META,
  IDB_STORE_RECEIPT_PHOTOS,
  IDB_STORE_RECEIPTS,
  IDB_STORE_SYSTEM_META,
} from "@/lib/storage/idbStores";

/** Legacy v4 store name → snaptax v5 store name (same-name pairs included). */
export const LEGACY_DB_STORE_COPY_PAIRS: readonly (readonly [string, string])[] =
  [
    [IDB_LEGACY_RECEIPTS, IDB_STORE_RECEIPTS],
    [IDB_STORE_RECEIPTS, IDB_STORE_RECEIPTS],
    [IDB_LEGACY_SYSTEM_META, IDB_STORE_SYSTEM_META],
    [IDB_STORE_SYSTEM_META, IDB_STORE_SYSTEM_META],
    [IDB_LEGACY_CRYPTO_META, IDB_STORE_CRYPTO_META],
    [IDB_STORE_CRYPTO_META, IDB_STORE_CRYPTO_META],
    [IDB_LEGACY_PHOTOS, IDB_LEGACY_PHOTOS],
    [IDB_STORE_RECEIPT_PHOTOS, IDB_STORE_RECEIPT_PHOTOS],
  ];

export function planLegacyDbStoreCopies(
  legacyStoreNames: Iterable<string>,
  targetStoreNames: Iterable<string>,
): Array<{ from: string; to: string }> {
  const legacy = new Set(legacyStoreNames);
  const target = new Set(targetStoreNames);
  const planned: Array<{ from: string; to: string }> = [];
  const seen = new Set<string>();

  for (const [from, to] of LEGACY_DB_STORE_COPY_PAIRS) {
    if (!legacy.has(from) || !target.has(to)) continue;
    const key = `${from}→${to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    planned.push({ from, to });
  }
  return planned;
}

function tryOpenDb(name: string): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const req = indexedDB.open(name);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
    req.onsuccess = () => resolve(req.result);
  });
}

function deleteDb(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("IDB_DELETE_BLOCKED"));
    req.onsuccess = () => resolve();
  });
}

function getAllRows(db: IDBDatabase, storeName: string): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result ?? []);
  });
}

async function storeHasRows(db: IDBDatabase, storeName: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const request = tx.objectStore(storeName).count();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result ?? 0) > 0);
  });
}

async function dbHasAnyData(db: IDBDatabase): Promise<boolean> {
  for (const name of db.objectStoreNames) {
    if (await storeHasRows(db, name)) return true;
  }
  return false;
}

async function copyMappedStores(
  from: IDBDatabase,
  to: IDBDatabase,
): Promise<void> {
  const copies = planLegacyDbStoreCopies(from.objectStoreNames, to.objectStoreNames);
  if (copies.length === 0) return;

  const rowsByTarget = new Map<string, unknown[]>();
  for (const { from: fromStore, to: toStore } of copies) {
    const rows = await getAllRows(from, fromStore);
    if (rows.length === 0) continue;
    const existing = rowsByTarget.get(toStore) ?? [];
    rowsByTarget.set(toStore, existing.concat(rows));
  }

  const targetStores = [...rowsByTarget.keys()];
  if (targetStores.length === 0) return;

  await new Promise<void>((resolve, reject) => {
    const tx = to.transaction(targetStores, "readwrite");
    for (const toStore of targetStores) {
      const store = tx.objectStore(toStore);
      for (const row of rowsByTarget.get(toStore) ?? []) {
        store.put(row);
      }
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let renameMigrationDone = false;

/** One-time copy `snap1099` → `snaptax`, then delete legacy DB. */
export async function migrateLegacyIdbDbNameIfNeeded(
  openTargetDb: () => Promise<IDBDatabase>,
): Promise<void> {
  if (renameMigrationDone || typeof indexedDB === "undefined") return;

  const legacyDb = await tryOpenDb(IDB_LEGACY_DB_NAME);
  if (!legacyDb) {
    renameMigrationDone = true;
    return;
  }

  try {
    const legacyHasData = await dbHasAnyData(legacyDb);
    if (!legacyHasData) {
      legacyDb.close();
      await deleteDb(IDB_LEGACY_DB_NAME);
      renameMigrationDone = true;
      return;
    }

    const targetDb = await openTargetDb();
    try {
      await copyMappedStores(legacyDb, targetDb);
    } finally {
      targetDb.close();
    }

    legacyDb.close();
    await deleteDb(IDB_LEGACY_DB_NAME);
    renameMigrationDone = true;
  } catch (err) {
    legacyDb.close();
    if (typeof console !== "undefined") {
      console.warn("[idb] snap1099→snaptax migration failed", err);
    }
    throw err;
  }
}

export async function deleteLegacyIdbIfPresent(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await deleteDb(IDB_LEGACY_DB_NAME).catch(() => {});
}

/** Test-only reset. */
export function resetIdbRenameMigrationForTests(): void {
  renameMigrationDone = false;
}
