import type { Receipt, ReceiptStatus } from "@/lib/types";
import { filedFlag } from "@/lib/receipts/filedStatus";
import { parseUtcISOString, toUtcISOString } from "@/lib/time/utc";
import { CRYPTO_META_STORE } from "@/lib/storage/crypto/keyManager";
import { migrateLegacyPlainPhotos } from "@/lib/storage/crypto/photoMigration";
import {
  deleteEncryptedPhoto,
  loadEncryptedPhoto,
  PHOTOS_STORE,
  saveEncryptedPhoto,
} from "@/lib/storage/crypto/photoStore";

const DB_NAME = "snap1099";
const DB_VERSION = 4;
const RECEIPTS_STORE = "receipts";
const SYSTEM_META_STORE = "system_meta";

type SystemMetaRow<T> = { key: string; value: T };

export interface StoredReceipt extends Receipt {
  timestamp: Date;
  pendingUpload?: boolean;
  writeBudgetRemaining?: number;
}

type SerializedReceipt = Omit<
  StoredReceipt,
  "timestamp" | "updatedAt" | "taxSeasonDate"
> & {
  timestamp: string;
  updatedAt?: string;
  taxSeasonDate?: string;
  updatedAtMs: number;
  createdAtMs: number;
  isFiled: 0 | 1;
  hasRemoteImage: boolean;
};

function receiptUpdatedAt(receipt: Pick<Receipt, "updatedAt" | "timestamp">): Date {
  return receipt.updatedAt ?? receipt.timestamp;
}

function toMs(date: Date): number {
  return date.getTime();
}

function enrichRow(receipt: StoredReceipt): SerializedReceipt {
  const updatedAt = receiptUpdatedAt(receipt);
  const { taxSeasonDate, updatedAt: _u, ...rest } = receipt;
  return {
    ...rest,
    hasRemoteImage: Boolean(receipt.hasRemoteImage),
    timestamp: toUtcISOString(receipt.timestamp),
    updatedAt: toUtcISOString(updatedAt),
    taxSeasonDate: taxSeasonDate ? toUtcISOString(taxSeasonDate) : undefined,
    updatedAtMs: toMs(updatedAt),
    createdAtMs: toMs(receipt.timestamp),
    isFiled: filedFlag(receipt),
  };
}

function deserializeReceipt(raw: SerializedReceipt): StoredReceipt {
  const {
    updatedAtMs: _updatedAtMs,
    createdAtMs: _createdAtMs,
    isFiled: _isFiled,
    ...rest
  } = raw;
  const timestamp = parseUtcISOString(rest.timestamp);
  return {
    ...rest,
    hasRemoteImage: Boolean(rest.hasRemoteImage),
    timestamp,
    updatedAt: rest.updatedAt ? parseUtcISOString(rest.updatedAt) : timestamp,
    taxSeasonDate: rest.taxSeasonDate
      ? parseUtcISOString(rest.taxSeasonDate)
      : undefined,
  };
}

function legacyDeserialize(raw: Record<string, unknown>): StoredReceipt {
  const timestamp = parseUtcISOString(String(raw.timestamp));
  const updatedAtRaw = raw.updatedAt ? parseUtcISOString(String(raw.updatedAt)) : timestamp;
  return {
    id: String(raw.id),
    status: raw.status as ReceiptStatus,
    amount: raw.amount as number | undefined,
    merchant: raw.merchant as string | undefined,
    category: raw.category as string | undefined,
    taxAmount: raw.taxAmount as number | undefined,
    dataRegion: raw.dataRegion as StoredReceipt["dataRegion"],
    currency: raw.currency as string | undefined,
    deductible: raw.deductible as boolean | undefined,
    imageUrl: raw.imageUrl as string | null | undefined,
    hasRemoteImage: Boolean(raw.hasRemoteImage),
    subtitle: raw.subtitle as string | undefined,
    timestamp,
    updatedAt: updatedAtRaw,
    taxSeason: raw.taxSeason as string | undefined,
    taxSeasonDate: raw.taxSeasonDate
      ? parseUtcISOString(String(raw.taxSeasonDate))
      : undefined,
    pendingUpload: raw.pendingUpload as boolean | undefined,
    writeBudgetRemaining: raw.writeBudgetRemaining as number | undefined,
    isOnboardingDemo: raw.isOnboardingDemo as boolean | undefined,
  };
}

function createReceiptIndexes(store: IDBObjectStore): void {
  store.createIndex("byUpdatedAt", "updatedAtMs", { unique: false });
  store.createIndex("byCreatedAt", "createdAtMs", { unique: false });
  store.createIndex("byStatus", "status", { unique: false });
  store.createIndex("byStatusUpdatedAt", ["status", "updatedAtMs"], {
    unique: false,
  });
  store.createIndex("byFiledUpdatedAt", ["isFiled", "updatedAtMs"], {
    unique: false,
  });
  store.createIndex("byFiledStatus", ["isFiled", "status"], { unique: false });
}

function readIndexLimited<T>(
  store: IDBObjectStore,
  indexName: string,
  range: IDBKeyRange | null,
  direction: IDBCursorDirection,
  limit: number,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const index = store.index(indexName);
    const rows: T[] = [];
    const request = index.openCursor(range, direction);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor || rows.length >= limit) {
        resolve(rows);
        return;
      }
      rows.push(cursor.value as T);
      cursor.continue();
    };
  });
}

function readIndexAll<T>(
  store: IDBObjectStore,
  indexName: string,
  range: IDBKeyRange | null,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const index = store.index(indexName);
    const rows: T[] = [];
    const request = index.openCursor(range);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(rows);
        return;
      }
      rows.push(cursor.value as T);
      cursor.continue();
    };
  });
}

function migrateReceiptRowV3(raw: Record<string, unknown>): SerializedReceipt {
  const legacy = legacyDeserialize(raw);
  if (legacy.hasRemoteImage == null) {
    legacy.hasRemoteImage = false;
  }
  return enrichRow(legacy);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const tx = request.transaction!;
      let receiptStore: IDBObjectStore;

      if (!db.objectStoreNames.contains(CRYPTO_META_STORE)) {
        db.createObjectStore(CRYPTO_META_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(RECEIPTS_STORE)) {
        receiptStore = db.createObjectStore(RECEIPTS_STORE, { keyPath: "id" });
        createReceiptIndexes(receiptStore);
      } else {
        receiptStore = tx.objectStore(RECEIPTS_STORE);
        if (event.oldVersion < 2) {
          createReceiptIndexes(receiptStore);
          const migrate = receiptStore.openCursor();
          migrate.onerror = () => reject(migrate.error);
          migrate.onsuccess = () => {
            const cursor = migrate.result;
            if (!cursor) return;
            const legacy = legacyDeserialize(cursor.value as Record<string, unknown>);
            cursor.update(enrichRow(legacy));
            cursor.continue();
          };
        }
        if (event.oldVersion < 3) {
          const migrateV3 = receiptStore.openCursor();
          migrateV3.onerror = () => reject(migrateV3.error);
          migrateV3.onsuccess = () => {
            const cursor = migrateV3.result;
            if (!cursor) return;
            const row = migrateReceiptRowV3(cursor.value as Record<string, unknown>);
            cursor.update(row);
            cursor.continue();
          };
        }
      }

      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: "id" });
      }

      if (event.oldVersion < 4) {
        if (!db.objectStoreNames.contains(SYSTEM_META_STORE)) {
          db.createObjectStore(SYSTEM_META_STORE, { keyPath: "key" });
        }
      }
    };
  });
}

let migrationPromise: Promise<void> | null = null;

async function ensurePhotoCipherReady(db: IDBDatabase): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrateLegacyPlainPhotos(db).catch((err) => {
      migrationPromise = null;
      throw err;
    });
  }
  await migrationPromise;
}

export async function warmReceiptDb(): Promise<IDBDatabase> {
  const db = await openDb();
  await ensurePhotoCipherReady(db);
  return db;
}

export async function loadRecentUnfiledReceipts(
  limit = 30,
): Promise<StoredReceipt[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RECEIPTS_STORE, "readonly");
    const store = tx.objectStore(RECEIPTS_STORE);
    const range = IDBKeyRange.bound([0, 0], [0, Number.MAX_SAFE_INTEGER]);
    readIndexLimited<SerializedReceipt>(
      store,
      "byFiledUpdatedAt",
      range,
      "prev",
      limit,
    )
      .then((rows) => resolve(rows.map(deserializeReceipt)))
      .catch(reject);
  });
}

export async function loadTopByUpdatedAt(
  limit = 100,
): Promise<StoredReceipt[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RECEIPTS_STORE, "readonly");
    const store = tx.objectStore(RECEIPTS_STORE);
    readIndexLimited<SerializedReceipt>(
      store,
      "byUpdatedAt",
      null,
      "prev",
      limit,
    )
      .then((rows) => resolve(rows.map(deserializeReceipt)))
      .catch(reject);
  });
}

export async function sumUnfiledLocalTaxSavedIndexed(): Promise<number> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RECEIPTS_STORE, "readonly");
    const store = tx.objectStore(RECEIPTS_STORE);
    const range = IDBKeyRange.only([0, "done"]);
    readIndexAll<SerializedReceipt>(store, "byFiledStatus", range)
      .then((rows) => {
        const sum = rows.reduce(
          (total, row) => total + (row.taxAmount ?? 0),
          0,
        );
        resolve(sum);
      })
      .catch(reject);
  });
}

export async function queryByStatus(
  status: ReceiptStatus,
  limit?: number,
): Promise<StoredReceipt[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RECEIPTS_STORE, "readonly");
    const store = tx.objectStore(RECEIPTS_STORE);
    const range = IDBKeyRange.only(status);
    const read = limit
      ? readIndexLimited<SerializedReceipt>(
          store,
          "byStatus",
          range,
          "prev",
          limit,
        )
      : readIndexAll<SerializedReceipt>(store, "byStatus", range);
    read
      .then((rows) => resolve(rows.map(deserializeReceipt)))
      .catch(reject);
  });
}

/** Full corpus scan — sync merge / export only; not for startup hot path. */
export async function loadAllReceipts(): Promise<StoredReceipt[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RECEIPTS_STORE, "readonly");
    const request = tx.objectStore(RECEIPTS_STORE).getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const rows = (request.result as SerializedReceipt[]) ?? [];
      resolve(
        rows
          .map(deserializeReceipt)
          .sort(
            (a, b) =>
              receiptUpdatedAt(b).getTime() - receiptUpdatedAt(a).getTime(),
          ),
      );
    };
  });
}

/** @deprecated Use loadTopByUpdatedAt or loadAllReceipts. */
export async function loadReceipts(): Promise<StoredReceipt[]> {
  return loadAllReceipts();
}

export async function loadReceipt(id: string): Promise<StoredReceipt | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RECEIPTS_STORE, "readonly");
    const request = tx.objectStore(RECEIPTS_STORE).get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const raw = request.result as SerializedReceipt | undefined;
      resolve(raw ? deserializeReceipt(raw) : null);
    };
  });
}

export async function saveReceipt(receipt: StoredReceipt): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RECEIPTS_STORE, "readwrite");
    const request = tx.objectStore(RECEIPTS_STORE).put(enrichRow(receipt));
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function deleteReceipt(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([RECEIPTS_STORE, PHOTOS_STORE], "readwrite");
    tx.objectStore(RECEIPTS_STORE).delete(id);
    tx.objectStore(PHOTOS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDb();
  await deleteEncryptedPhoto(db, id);
}

/** Remove redundant local photos when server already holds the image. */
export async function reconcileServerPrimaryPhotos(
  receipts: Pick<Receipt, "id" | "hasRemoteImage">[],
): Promise<void> {
  const db = await openDb();
  await Promise.all(
    receipts
      .filter((r) => r.hasRemoteImage)
      .map((r) => deleteEncryptedPhoto(db, r.id)),
  );
}

export async function savePhoto(id: string, file: File | Blob): Promise<void> {
  const db = await openDb();
  await ensurePhotoCipherReady(db);
  await saveEncryptedPhoto(db, id, file);
}

export async function loadPhoto(id: string): Promise<Blob | null> {
  const db = await openDb();
  await ensurePhotoCipherReady(db);
  return loadEncryptedPhoto(db, id);
}

export async function hasStoredData(): Promise<boolean> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RECEIPTS_STORE, "readonly");
    const request = tx.objectStore(RECEIPTS_STORE).count();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result ?? 0) > 0);
  });
}

export async function readSystemMeta<T>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYSTEM_META_STORE, "readonly");
    const request = tx.objectStore(SYSTEM_META_STORE).get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const row = request.result as SystemMetaRow<T> | undefined;
      resolve(row?.value ?? null);
    };
  });
}

export async function writeSystemMeta<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYSTEM_META_STORE, "readwrite");
    const request = tx
      .objectStore(SYSTEM_META_STORE)
      .put({ key, value } satisfies SystemMetaRow<T>);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function clearAllLocalData(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const stores = [RECEIPTS_STORE, PHOTOS_STORE];
    if (db.objectStoreNames.contains(CRYPTO_META_STORE)) {
      stores.push(CRYPTO_META_STORE);
    }
    if (db.objectStoreNames.contains(SYSTEM_META_STORE)) {
      stores.push(SYSTEM_META_STORE);
    }
    const tx = db.transaction(stores, "readwrite");
    tx.objectStore(RECEIPTS_STORE).clear();
    tx.objectStore(PHOTOS_STORE).clear();
    if (db.objectStoreNames.contains(CRYPTO_META_STORE)) {
      tx.objectStore(CRYPTO_META_STORE).clear();
    }
    if (db.objectStoreNames.contains(SYSTEM_META_STORE)) {
      tx.objectStore(SYSTEM_META_STORE).clear();
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
