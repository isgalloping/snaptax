import {
  IDB_STORE_RECEIPT_EVENTS,
} from "@/lib/storage/idbStores";
import type {
  ReceiptEventInput,
  StoredReceiptEvent,
} from "@/lib/storage/receiptEventTypes";
import { RECEIPT_EVENT_BATCH_SIZE } from "@/lib/storage/receiptEventTypes";
import { warmReceiptDb } from "@/lib/storage/receiptDb";

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

/** Append-only lifecycle event (Phase 2 spike). */
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
  const idSet = new Set(eventIds);
  const syncedAtMs = Date.now();
  const rows = await new Promise<StoredReceiptEvent[]>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_RECEIPT_EVENTS, "readonly");
    const request = tx.objectStore(IDB_STORE_RECEIPT_EVENTS).getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve((request.result as StoredReceiptEvent[] | undefined) ?? []);
    };
  });
  const toUpdate = rows.filter((row) => idSet.has(row.id));
  if (toUpdate.length === 0) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_RECEIPT_EVENTS, "readwrite");
    const store = tx.objectStore(IDB_STORE_RECEIPT_EVENTS);
    for (const row of toUpdate) {
      store.put({
        ...row,
        syncStatus: "synced",
        syncedAtMs,
      });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
