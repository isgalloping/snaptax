import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSeasonSummaryFromReceipts } from "@/lib/storage/receiptSummary";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

describe("buildSeasonSummaryFromReceipts", () => {
  it("matches scan logic for mixed statuses", () => {
    const receipts: StoredReceipt[] = [
      {
        id: "1",
        status: "processing",
        timestamp: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: "2",
        status: "done",
        taxAmount: 4,
        timestamp: new Date("2026-02-02T00:00:00.000Z"),
      },
      {
        id: "3",
        status: "done",
        taxAmount: 6,
        taxSeason: "2026",
        taxSeasonDate: new Date("2026-04-01T00:00:00.000Z"),
        timestamp: new Date("2026-02-03T00:00:00.000Z"),
      },
    ];
    const summary = buildSeasonSummaryFromReceipts(receipts, 2026, "UTC");
    assert.equal(summary.totalReceiptCount, 3);
    assert.equal(summary.unfiledTaxSaved, 4);
  });
});
