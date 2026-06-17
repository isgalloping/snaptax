import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import {
  computeTaxDeadline,
  deadlineUrgency,
  nextEstimatedTaxDeadline,
} from "@/lib/home/computeTaxDeadline";

describe("computeTaxDeadline", () => {
  it("nextEstimatedTaxDeadline picks nearest future US date", () => {
    const now = new Date("2026-06-10T12:00:00.000Z");
    const next = nextEstimatedTaxDeadline(now, "UTC");
    assert.equal(next.getUTCMonth(), 5); // Jun = month 5 → Jun 15
    assert.equal(next.getUTCDate(), 15);
  });

  it("deadlineUrgency thresholds", () => {
    assert.equal(deadlineUrgency(31), "safe");
    assert.equal(deadlineUrgency(30), "attention");
    assert.equal(deadlineUrgency(14), "attention");
    assert.equal(deadlineUrgency(13), "urgent");
  });

  it("projected payment from deductions / 4", () => {
    const receipts: Receipt[] = [
      {
        id: "1",
        status: "done",
        amount: 1000,
        category: "TOOLS",
        deductible: true,
        timestamp: new Date("2026-03-01T12:00:00.000Z"),
      },
    ];
    const info = computeTaxDeadline(receipts, {
      now: new Date("2026-06-10T12:00:00.000Z"),
      timeZone: "UTC",
      marginalRate: 0.25,
    });
    assert.equal(info.projectedPayment, 62.5); // 1000 * 0.25 / 4
    assert.equal(info.expenses, 1000);
    assert.equal(info.income, 0);
    assert.equal(info.netProfit, -1000);
  });
});
