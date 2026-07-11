import { apiFetch } from "@/lib/client/ghostClient";
import { shouldRunHiddenBackgroundSync } from "@/lib/client/backgroundSyncGate";
import { isWorkerSessionActive } from "@/lib/client/workerSessionGate";
import {
  listPendingReceiptEvents,
  markReceiptEventsSynced,
} from "@/lib/storage/receiptEventQueue";
import { advanceStoredReceiptEventSyncCursor } from "@/lib/storage/receiptEventSyncCursor";
import type { SyncReceiptEventPayload } from "@/lib/storage/receiptEventTypes";
import { RECEIPT_EVENT_BATCH_SIZE } from "@/lib/storage/receiptEventTypes";

export type FlushReceiptEventBatchResult = {
  attempted: number;
  synced: number;
  skipped: boolean;
};

function canFlushReceiptEvents(cameraOpen: boolean): boolean {
  if (typeof navigator === "undefined" || !navigator.onLine) return false;
  if (isWorkerSessionActive({ cameraOpen })) return false;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return shouldRunHiddenBackgroundSync();
  }
  return true;
}

/** POST pending lifecycle events to server (batch 50). */
export async function flushReceiptEventBatch(options?: {
  cameraOpen?: boolean;
  force?: boolean;
}): Promise<FlushReceiptEventBatchResult> {
  const cameraOpen = options?.cameraOpen ?? false;
  if (!options?.force && !canFlushReceiptEvents(cameraOpen)) {
    return { attempted: 0, synced: 0, skipped: true };
  }

  const pending = await listPendingReceiptEvents(RECEIPT_EVENT_BATCH_SIZE);
  if (pending.length === 0) {
    return { attempted: 0, synced: 0, skipped: false };
  }

  const events: SyncReceiptEventPayload[] = pending.map((row) => ({
    id: row.id,
    receiptId: row.receiptId,
    type: row.type,
    payload: row.payload,
    createdAtMs: row.createdAtMs,
  }));

  const res = await apiFetch("/api/sync/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  });

  if (!res.ok) {
    throw new Error(`EVENT_SYNC_FAILED:${res.status}`);
  }

  const body = (await res.json()) as { syncedIds?: string[] };
  const syncedIds = body.syncedIds ?? events.map((event) => event.id);
  await markReceiptEventsSynced(syncedIds);
  const syncedRows = pending.filter((row) => syncedIds.includes(row.id));
  await advanceStoredReceiptEventSyncCursor(
    syncedRows.map((row) => ({
      id: row.id,
      clientCreatedAtMs: row.createdAtMs,
    })),
  );
  return {
    attempted: events.length,
    synced: syncedIds.length,
    skipped: false,
  };
}
