import type { Receipt } from "@/lib/types";
import { parseUtcISOString, toUtcISOString } from "@/lib/time/utc";

const DB_NAME = "snap1099";
const DB_VERSION = 1;
const RECEIPTS_STORE = "receipts";
const PHOTOS_STORE = "photos";

export interface StoredReceipt extends Receipt {
  timestamp: Date;
  pendingUpload?: boolean;
  writeBudgetRemaining?: number;
}

type SerializedReceipt = Omit<StoredReceipt, "timestamp" | "updatedAt"> & {
  timestamp: string;
  updatedAt?: string;
};

export async function warmReceiptDb(): Promise<IDBDatabase> {
  return openDb();
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RECEIPTS_STORE)) {
        db.createObjectStore(RECEIPTS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: "id" });
      }
    };
  });
}

function serializeReceipt(receipt: StoredReceipt): SerializedReceipt {
  const { updatedAt, ...rest } = receipt;
  return {
    ...rest,
    timestamp: toUtcISOString(receipt.timestamp),
    updatedAt: updatedAt ? toUtcISOString(updatedAt) : undefined,
  };
}

function deserializeReceipt(raw: SerializedReceipt): StoredReceipt {
  const timestamp = parseUtcISOString(raw.timestamp);
  return {
    ...raw,
    timestamp,
    updatedAt: raw.updatedAt ? parseUtcISOString(raw.updatedAt) : timestamp,
  };
}

function receiptUpdatedAt(receipt: Pick<Receipt, "updatedAt" | "timestamp">): Date {
  return receipt.updatedAt ?? receipt.timestamp;
}

function sortByUpdatedAtDesc(a: StoredReceipt, b: StoredReceipt): number {
  return receiptUpdatedAt(b).getTime() - receiptUpdatedAt(a).getTime();
}

export async function loadReceipts(): Promise<StoredReceipt[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RECEIPTS_STORE, "readonly");
    const request = tx.objectStore(RECEIPTS_STORE).getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const rows = (request.result as SerializedReceipt[]) ?? [];
      resolve(rows.map(deserializeReceipt).sort(sortByUpdatedAtDesc));
    };
  });
}

export async function saveReceipt(receipt: StoredReceipt): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RECEIPTS_STORE, "readwrite");
    const request = tx.objectStore(RECEIPTS_STORE).put(serializeReceipt(receipt));

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
  const receipts = await loadReceipts();
  return receipts.length > 0;
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
