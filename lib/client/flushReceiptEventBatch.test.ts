import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RECEIPT_EVENT_BATCH_SIZE } from "@/lib/storage/receiptEventTypes";

describe("flushReceiptEventBatch", () => {
  it("uses batch size of 50", () => {
    assert.equal(RECEIPT_EVENT_BATCH_SIZE, 50);
  });
});
