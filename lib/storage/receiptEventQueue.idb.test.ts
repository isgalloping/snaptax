import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clearAllLocalData } from "@/lib/storage/receiptDb";
import {
  appendReceiptEvent,
  listPendingReceiptEvents,
  markReceiptEventsSynced,
  pruneSyncedReceiptEvents,
} from "@/lib/storage/receiptEventQueue";

const RECEIPT_ID = "00000000-0000-0000-0000-000000000001";

describe("receiptEventQueue IDB integration", () => {
  it("append → mark synced removes row from pending index", async () => {
    await clearAllLocalData();
    const event = await appendReceiptEvent({
      receiptId: RECEIPT_ID,
      type: "RECEIPT_CREATED",
      payload: { pendingUpload: true },
      createdAtMs: 1_700_000_000_000,
    });

    const pendingBefore = await listPendingReceiptEvents();
    assert.equal(pendingBefore.length, 1);
    assert.equal(pendingBefore[0]?.id, event.id);

    await markReceiptEventsSynced([event.id]);

    const pendingAfter = await listPendingReceiptEvents();
    assert.equal(pendingAfter.length, 0);
  });

  it("pruneSyncedReceiptEvents deletes stale synced rows only", async () => {
    await clearAllLocalData();
    const nowMs = Date.now();
    const event = await appendReceiptEvent({
      receiptId: RECEIPT_ID,
      type: "OCR_COMPLETED",
      payload: { source: "local_ocr" },
      createdAtMs: nowMs,
    });
    await markReceiptEventsSynced([event.id]);

    const pruned = await pruneSyncedReceiptEvents(1_000, nowMs + 2_000);
    assert.equal(pruned, 1);

    const pending = await listPendingReceiptEvents();
    assert.equal(pending.length, 0);
  });
});
