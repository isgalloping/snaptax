import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeSummaryDelta } from "@/lib/storage/receiptSummaryDelta";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

const TZ = "UTC";
const YEAR = 2026;

function receipt(partial: Partial<StoredReceipt> & Pick<StoredReceipt, "id">): StoredReceipt {
  return {
    status: "processing",
    timestamp: new Date("2026-03-01T12:00:00.000Z"),
    ...partial,
  };
}

describe("computeSummaryDelta", () => {
  it("insert processing receipt increments totalReceiptCount only", () => {
    const d = computeSummaryDelta(null, receipt({ id: "1" }), YEAR, TZ);
    assert.equal(d.totalReceiptCount, 1);
    assert.equal(d.unfiledTaxSaved, 0);
  });

  it("done unfiled receipt adds taxAmount to unfiledTaxSaved", () => {
    const next = receipt({ id: "1", status: "done", taxAmount: 12.5 });
    const d = computeSummaryDelta(null, next, YEAR, TZ);
    assert.equal(d.unfiledTaxSaved, 12.5);
  });

  it("filed receipt does not add to unfiledTaxSaved", () => {
    const next = receipt({
      id: "1",
      status: "done",
      taxAmount: 12.5,
      taxSeason: "2026",
      taxSeasonDate: new Date("2026-04-01T00:00:00.000Z"),
    });
    const d = computeSummaryDelta(null, next, YEAR, TZ);
    assert.equal(d.unfiledTaxSaved, 0);
    assert.equal(d.totalReceiptCount, 1);
  });

  it("export filed transition subtracts prior unfiled tax", () => {
    const prev = receipt({ id: "1", status: "done", taxAmount: 10 });
    const next = receipt({
      id: "1",
      status: "done",
      taxAmount: 10,
      taxSeason: "2026",
      taxSeasonDate: new Date("2026-04-15T00:00:00.000Z"),
    });
    const d = computeSummaryDelta(prev, next, YEAR, TZ);
    assert.equal(d.unfiledTaxSaved, -10);
    assert.equal(d.totalReceiptCount, 0);
  });

  it("delete removes contributions", () => {
    const prev = receipt({ id: "1", status: "done", taxAmount: 5 });
    const d = computeSummaryDelta(prev, null, YEAR, TZ);
    assert.equal(d.unfiledTaxSaved, -5);
    assert.equal(d.totalReceiptCount, -1);
  });

  it("ignores receipts outside current tax year", () => {
    const next = receipt({
      id: "1",
      timestamp: new Date("2025-01-01T00:00:00.000Z"),
    });
    const d = computeSummaryDelta(null, next, YEAR, TZ);
    assert.equal(d.totalReceiptCount, 0);
  });
});
