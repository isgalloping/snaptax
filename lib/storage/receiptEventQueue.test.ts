import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  appendReceiptEvent,
  listPendingReceiptEvents,
  markReceiptEventsSynced,
} from "@/lib/storage/receiptEventQueue";
import { clearAllLocalData } from "@/lib/storage/receiptDb";

describe("receiptEventQueue", () => {
  beforeEach(async () => {
    await clearAllLocalData();
  });

  it("lists pending events oldest first and honors the batch limit", async () => {
    const newer = await appendReceiptEvent({
      receiptId: "00000000-0000-0000-0000-000000000001",
      type: "RECEIPT_CREATED",
      payload: { pendingUpload: true },
      createdAtMs: 1_700_000_000_200,
    });
    const older = await appendReceiptEvent({
      receiptId: "00000000-0000-0000-0000-000000000002",
      type: "OCR_COMPLETED",
      payload: { source: "local_ocr" },
      createdAtMs: 1_700_000_000_100,
    });

    const firstBatch = await listPendingReceiptEvents(1);
    assert.deepEqual(
      firstBatch.map((event) => event.id),
      [older.id],
    );

    const allPending = await listPendingReceiptEvents();
    assert.deepEqual(
      allPending.map((event) => event.id),
      [older.id, newer.id],
    );
    assert.equal(allPending[0]?.syncStatus, "pending");
    assert.deepEqual(allPending[0]?.payload, { source: "local_ocr" });
  });

  it("marks only acknowledged events as synced", async () => {
    const acknowledged = await appendReceiptEvent({
      receiptId: "00000000-0000-0000-0000-000000000003",
      type: "TAX_CALCULATED",
      payload: { taxAmount: 12.34 },
      createdAtMs: 1_700_000_000_300,
    });
    const retryLater = await appendReceiptEvent({
      receiptId: "00000000-0000-0000-0000-000000000004",
      type: "RECEIPT_CREATED",
      createdAtMs: 1_700_000_000_400,
    });

    await markReceiptEventsSynced([acknowledged.id]);
    await markReceiptEventsSynced([]);
    await markReceiptEventsSynced(["missing-event"]);

    const pending = await listPendingReceiptEvents();
    assert.deepEqual(
      pending.map((event) => event.id),
      [retryLater.id],
    );
    assert.deepEqual(pending[0]?.payload, {});
  });
});
