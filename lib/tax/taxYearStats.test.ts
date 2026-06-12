import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import {
  availableTaxYears,
  receiptTaxYear,
  receiptsInTaxYear,
  taxYearDeductions,
} from "@/lib/tax/taxYearStats";

function receipt(overrides: Partial<Receipt> & { timestamp: Date }): Receipt {
  return {
    id: "r1",
    status: "done",
    amount: 100,
    category: "TOOLS",
    deductible: true,
    ...overrides,
  };
}

describe("taxYearStats", () => {
  it("receiptTaxYear uses timezone calendar year", () => {
    const edgeUtc = new Date("2025-01-01T07:59:00.000Z");
    assert.equal(receiptTaxYear(edgeUtc, "America/Los_Angeles"), 2024);
    assert.equal(receiptTaxYear(edgeUtc, "UTC"), 2025);
  });

  it("filters and sums deductions for a tax year", () => {
    const receipts = [
      receipt({ id: "a", timestamp: new Date("2025-06-01T12:00:00.000Z") }),
      receipt({
        id: "b",
        timestamp: new Date("2024-12-01T12:00:00.000Z"),
        amount: 50,
        category: "MEALS",
      }),
      receipt({
        id: "c",
        timestamp: new Date("2025-07-01T12:00:00.000Z"),
        status: "processing",
      }),
    ];
    assert.equal(receiptsInTaxYear(receipts, 2025, "UTC").length, 1);
    assert.equal(taxYearDeductions(receipts, 2024, "UTC"), 25);
    assert.deepEqual(availableTaxYears(receipts, "UTC"), [2025, 2024]);
  });
});
