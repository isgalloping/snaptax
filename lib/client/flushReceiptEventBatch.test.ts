import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RECEIPT_EVENT_SYNC_CURSOR_META_KEY } from "@/lib/storage/receiptEventSyncCursor";

describe("flushReceiptEventBatch", () => {
  it("uses batch size of 50", async () => {
    const { RECEIPT_EVENT_BATCH_SIZE } = await import(
      "@/lib/storage/receiptEventTypes"
    );
    assert.equal(RECEIPT_EVENT_BATCH_SIZE, 50);
  });

  it("persists client cursor under stable system_meta key", () => {
    assert.equal(RECEIPT_EVENT_SYNC_CURSOR_META_KEY, "receipt_event_sync_cursor");
  });
});
