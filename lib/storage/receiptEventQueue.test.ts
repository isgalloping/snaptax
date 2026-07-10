import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendReceiptEvent,
  listPendingReceiptEvents,
  markReceiptEventsSynced,
} from "@/lib/storage/receiptEventQueue";
import type { StoredReceiptEvent } from "@/lib/storage/receiptEventTypes";

describe("receiptEventQueue", () => {
  it("exports append/list/mark helpers", () => {
    const event: StoredReceiptEvent = {
      id: "00000000-0000-0000-0000-000000000099",
      receiptId: "00000000-0000-0000-0000-000000000001",
      type: "RECEIPT_CREATED",
      payload: { pendingUpload: true },
      createdAtMs: 1_700_000_000_000,
      syncStatus: "pending",
    };
    assert.equal(event.type, "RECEIPT_CREATED");
    assert.equal(event.syncStatus, "pending");
    assert.equal(typeof appendReceiptEvent, "function");
    assert.equal(typeof listPendingReceiptEvents, "function");
    assert.equal(typeof markReceiptEventsSynced, "function");
  });
});
