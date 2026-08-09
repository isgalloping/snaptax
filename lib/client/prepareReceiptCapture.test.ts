import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_WRITE_BUDGET } from "@/lib/client/receiptSyncBudget";
import { buildPreparedProcessingReceipt } from "@/lib/client/prepareReceiptCapture";

const snappedAt = new Date("2026-01-02T03:04:05.000Z");

describe("buildPreparedProcessingReceipt", () => {
  it("builds a standard pending receipt without a 1099 capture kind", () => {
    const receipt = buildPreparedProcessingReceipt({
      id: "standard-receipt",
      contentSha256: "sha-standard",
      snappedAt,
    });

    assert.equal(receipt.id, "standard-receipt");
    assert.equal(receipt.status, "processing");
    assert.equal(receipt.merchant, "Scanning");
    assert.equal(receipt.timestamp, snappedAt);
    assert.equal(receipt.updatedAt, snappedAt);
    assert.equal(receipt.pendingUpload, true);
    assert.equal(receipt.contentSha256, "sha-standard");
    assert.equal(receipt.writeBudgetRemaining, MAX_WRITE_BUDGET);
    assert.equal("captureKind" in receipt, false);
  });

  it("persists the 1099 capture kind on the pending receipt", () => {
    const receipt = buildPreparedProcessingReceipt({
      id: "income-receipt",
      contentSha256: "sha-income",
      snappedAt,
      captureKind: "1099-K",
    });

    assert.equal(receipt.captureKind, "1099-K");
    assert.equal(receipt.pendingUpload, true);
    assert.equal(receipt.writeBudgetRemaining, MAX_WRITE_BUDGET);
  });
});
