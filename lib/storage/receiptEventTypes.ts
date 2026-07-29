export const RECEIPT_EVENT_BATCH_SIZE = 50 as const;

export type ReceiptLifecycleEventType =
  | "RECEIPT_CREATED"
  | "OCR_COMPLETED"
  | "TAX_CALCULATED";

export type ReceiptEventSyncStatus = "pending" | "synced";

export type StoredReceiptEvent = {
  id: string;
  receiptId: string;
  type: ReceiptLifecycleEventType;
  payload: Record<string, unknown>;
  createdAtMs: number;
  syncStatus: ReceiptEventSyncStatus;
  syncedAtMs?: number;
};

export type ReceiptEventInput = {
  receiptId: string;
  type: ReceiptLifecycleEventType;
  payload?: Record<string, unknown>;
  createdAtMs?: number;
};

export type SyncReceiptEventPayload = {
  id: string;
  receiptId: string;
  type: ReceiptLifecycleEventType;
  payload: Record<string, unknown>;
  createdAtMs: number;
};
