import {
  advanceReceiptSyncCursor,
  shouldAdvanceReceiptSyncCursor,
} from "@/lib/server/receiptSyncCursor";
import { readSystemMeta, writeSystemMeta } from "@/lib/storage/receiptDb";

export const RECEIPT_EVENT_SYNC_CURSOR_META_KEY =
  "receipt_event_sync_cursor" as const;

export type StoredReceiptEventSyncCursor = {
  lastEventId: string;
  lastClientCreatedAtMs: number;
};

export async function loadReceiptEventSyncCursor(): Promise<StoredReceiptEventSyncCursor | null> {
  return readSystemMeta<StoredReceiptEventSyncCursor>(
    RECEIPT_EVENT_SYNC_CURSOR_META_KEY,
  );
}

export async function saveReceiptEventSyncCursor(
  cursor: StoredReceiptEventSyncCursor,
): Promise<void> {
  await writeSystemMeta(RECEIPT_EVENT_SYNC_CURSOR_META_KEY, cursor);
}

export async function advanceStoredReceiptEventSyncCursor(
  events: Array<{ id: string; clientCreatedAtMs: number }>,
): Promise<StoredReceiptEventSyncCursor | null> {
  const existing = await loadReceiptEventSyncCursor();
  const next = advanceReceiptSyncCursor(existing, events);
  if (!next) return existing;
  if (existing && !shouldAdvanceReceiptSyncCursor(existing, next)) {
    return existing;
  }
  await saveReceiptEventSyncCursor(next);
  return next;
}
