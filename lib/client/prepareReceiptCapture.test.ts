import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_WRITE_BUDGET } from "@/lib/client/receiptSyncBudget";
import { buildPreparedReceipt } from "./prepareReceiptCapture.ts";

const snapAt = new Date("2026-03-15T10:20:30.000Z");

describe("buildPreparedReceipt", () => {
  it("persists the 1099 capture kind on a new processing receipt", () => {
    const receipt = buildPreparedReceipt({
      id: "receipt-1099-nec",
      snapAt,
      contentSha256: "sha-1099",
      captureKind: "1099-NEC",
    });

    assert.equal(receipt.id, "receipt-1099-nec");
    assert.equal(receipt.status, "processing");
    assert.equal(receipt.merchant, "Scanning");
    assert.equal(receipt.timestamp.toISOString(), snapAt.toISOString());
    assert.equal(receipt.updatedAt?.toISOString(), snapAt.toISOString());
    assert.equal(receipt.pendingUpload, true);
    assert.equal(receipt.contentSha256, "sha-1099");
    assert.equal(receipt.captureKind, "1099-NEC");
    assert.equal(receipt.writeBudgetRemaining, MAX_WRITE_BUDGET);
  });

  it("omits captureKind for ordinary receipt captures", () => {
    const receipt = buildPreparedReceipt({
      id: "receipt-standard",
      snapAt,
      contentSha256: "sha-standard",
    });

    assert.equal(Object.hasOwn(receipt, "captureKind"), false);
  });
});
