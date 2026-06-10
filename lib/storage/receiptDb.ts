import type { Receipt, ReceiptStatus } from "@/lib/types";
import { filedFlag } from "@/lib/receipts/filedStatus";
import { parseUtcISOString, toUtcISOString } from "@/lib/time/utc";

const DB_NAME = "snap1099";
const DB_VERSION = 2;
const RECEIPTS_STORE = "receipts";
const PHOTOS_STORE = "photos";

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
    subtitle: raw.subtitle as string | undefined,
    timestamp,
    updatedAt: updatedAtRaw,
    taxSeason: raw.taxSeason as string | undefined,
    taxSeasonDate: raw.taxSeasonDate
      ? parseUtcISOString(String(raw.taxSeasonDate))
      : undefined,
    pendingUpload: raw.pendingUpload as boolean | undefined,
    writeBudgetRemaining: raw.writeBudgetRemaining as number | undefined,
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

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const tx = request.transaction!;
      let receiptStore: IDBObjectStore;

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
      }

      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: "id" });
      }
    };
  });
}

export async function warmReceiptDb(): Promise<IDBDatabase> {
  return openDb();
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

export async function savePhoto(id: string, file: File | Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readwrite");
    const request = tx.objectStore(PHOTOS_STORE).put({ id, blob: file });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function loadPhoto(id: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTOS_STORE, "readonly");
    const request = tx.objectStore(PHOTOS_STORE).get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const row = request.result as { id: string; blob: Blob } | undefined;
      resolve(row?.blob ?? null);
    };
  });
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

export async function clearAllLocalData(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([RECEIPTS_STORE, PHOTOS_STORE], "readwrite");
    tx.objectStore(RECEIPTS_STORE).clear();
    tx.objectStore(PHOTOS_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
