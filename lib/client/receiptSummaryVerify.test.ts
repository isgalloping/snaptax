import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summaryWatermarkDrifted } from "@/lib/client/receiptSummaryVerify";
import type { ReceiptSummaryWatermark } from "@/lib/storage/receiptSummaryTypes";

describe("summaryWatermarkDrifted", () => {
  it("returns true when counts differ", () => {
    const wm: ReceiptSummaryWatermark = {
      maxUpdatedAtMs: 100,
      receiptCountInCurrentSeason: 2,
      schemaVersion: 1,
    };
    const computed = {
      maxUpdatedAtMs: 100,
      receiptCountInCurrentSeason: 3,
      schemaVersion: 1,
    };
    assert.equal(summaryWatermarkDrifted(wm, computed), true);
  });
});
