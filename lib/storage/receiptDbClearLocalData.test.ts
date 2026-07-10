import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearAllLocalData,
  saveReceipt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import { readCurrentSeasonSummary } from "@/lib/storage/receiptSummary";
import {
  appendReceiptEvent,
  listPendingReceiptEvents,
} from "@/lib/storage/receiptEventQueue";

function doneReceipt(id: string, taxAmount: number): StoredReceipt {
  return {
    id,
    status: "done",
    taxAmount,
    timestamp: new Date(),
    updatedAt: new Date(),
  };
}

describe("clearAllLocalData", () => {
  it("clears the receipt summary store with receipts", async () => {
    await clearAllLocalData();
    await saveReceipt(doneReceipt("receipt-before-clear", 12));

    const before = await readCurrentSeasonSummary();
    assert.equal(before.totalTaxSaved, 12);
    assert.equal(before.totalReceiptCount, 1);

    await clearAllLocalData();

    const after = await readCurrentSeasonSummary();
    assert.equal(after.totalTaxSaved, 0);
    assert.equal(after.totalReceiptCount, 0);

    await clearAllLocalData();
  });

  it("clears the receipt events store", async () => {
    await clearAllLocalData();
    await appendReceiptEvent({
      receiptId: "00000000-0000-0000-0000-000000000099",
      type: "RECEIPT_CREATED",
      payload: { pendingUpload: true },
    });
    assert.equal((await listPendingReceiptEvents()).length, 1);

    await clearAllLocalData();

    assert.equal((await listPendingReceiptEvents()).length, 0);
  });
});
