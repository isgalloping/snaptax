import {
  IDB_STORE_RECEIPT_EVENTS,
} from "@/lib/storage/idbStores";
import type {
  ReceiptEventInput,
  StoredReceiptEvent,
} from "@/lib/storage/receiptEventTypes";
import { RECEIPT_EVENT_BATCH_SIZE } from "@/lib/storage/receiptEventTypes";
import { warmReceiptDb } from "@/lib/storage/receiptDb";

export const RECEIPT_EVENT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

function eventsStoreExists(db: IDBDatabase): boolean {
  return db.objectStoreNames.contains(IDB_STORE_RECEIPT_EVENTS);
}

function toStoredEvent(input: ReceiptEventInput): StoredReceiptEvent {
  return {
    id: crypto.randomUUID(),
    receiptId: input.receiptId,
    type: input.type,
    payload: input.payload ?? {},
    createdAtMs: input.createdAtMs ?? Date.now(),
    syncStatus: "pending",
  };
}

/** Append-only lifecycle event. */
export async function appendReceiptEvent(
  input: ReceiptEventInput,
): Promise<StoredReceiptEvent> {
  const db = await warmReceiptDb();
  if (!eventsStoreExists(db)) {
    throw new Error("RECEIPT_EVENTS_STORE_MISSING");
  }
  const event = toStoredEvent(input);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_RECEIPT_EVENTS, "readwrite");
    const request = tx.objectStore(IDB_STORE_RECEIPT_EVENTS).add(event);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
  return event;
}

export async function listPendingReceiptEvents(
  limit = RECEIPT_EVENT_BATCH_SIZE,
): Promise<StoredReceiptEvent[]> {
  const db = await warmReceiptDb();
  if (!eventsStoreExists(db)) return [];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_RECEIPT_EVENTS, "readonly");
    const index = tx.objectStore(IDB_STORE_RECEIPT_EVENTS).index("bySyncStatus");
    const request = index.getAll("pending");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const rows = (request.result as StoredReceiptEvent[] | undefined) ?? [];
      rows.sort((a, b) => a.createdAtMs - b.createdAtMs);
      resolve(rows.slice(0, limit));
    };
  });
}

export async function markReceiptEventsSynced(eventIds: string[]): Promise<void> {
  if (eventIds.length === 0) return;
  const db = await warmReceiptDb();
  if (!eventsStoreExists(db)) return;
  const syncedAtMs = Date.now();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_RECEIPT_EVENTS, "readwrite");
    const store = tx.objectStore(IDB_STORE_RECEIPT_EVENTS);
    for (const id of eventIds) {
      const getReq = store.get(id);
      getReq.onerror = () => reject(getReq.error);
      getReq.onsuccess = () => {
        const row = getReq.result as StoredReceiptEvent | undefined;
        if (row) {
          store.put({
            ...row,
            syncStatus: "synced",
            syncedAtMs,
          });
        }
      };
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function shouldPruneSyncedReceiptEvent(
  event: StoredReceiptEvent,
  cutoffMs: number,
): boolean {
  return event.syncStatus === "synced" && (event.syncedAtMs ?? 0) < cutoffMs;
}

/** Remove synced events older than retention window (default 90d). */
export async function pruneSyncedReceiptEvents(
  maxAgeMs = RECEIPT_EVENT_RETENTION_MS,
  nowMs = Date.now(),
): Promise<number> {
  const db = await warmReceiptDb();
  if (!eventsStoreExists(db)) return 0;
  const cutoffMs = nowMs - maxAgeMs;
  const rows = await new Promise<StoredReceiptEvent[]>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_RECEIPT_EVENTS, "readonly");
    const index = tx.objectStore(IDB_STORE_RECEIPT_EVENTS).index("bySyncStatus");
    const request = index.getAll("synced");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve((request.result as StoredReceiptEvent[] | undefined) ?? []);
    };
  });
  const staleIds = rows
    .filter((row) => shouldPruneSyncedReceiptEvent(row, cutoffMs))
    .map((row) => row.id);
  if (staleIds.length === 0) return 0;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_RECEIPT_EVENTS, "readwrite");
    const store = tx.objectStore(IDB_STORE_RECEIPT_EVENTS);
    for (const id of staleIds) {
      store.delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return staleIds.length;
}
