import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import {
  availableTaxYears,
  countReceiptsInTaxYearAllStatuses,
  effectiveReceiptTaxYear,
  incomeFormsInTaxYear,
  receiptTaxYear,
  receiptsInTaxYear,
  taxYearDeductions,
  totalIncomeGrossInTaxYear,
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

  it("excludes 1099 income from deduction totals", () => {
    const receipts = [
      receipt({ id: "a", timestamp: new Date("2025-06-01T12:00:00.000Z") }),
      receipt({
        id: "b",
        timestamp: new Date("2025-07-01T12:00:00.000Z"),
        amount: 50000,
        category: "1099-NEC",
        deductible: true,
      }),
    ];
    assert.equal(taxYearDeductions(receipts, 2025, "UTC"), 100);
    assert.equal(incomeFormsInTaxYear(receipts, 2025, "UTC"), 1);
  });

  it("sums gross income from 1099 forms in tax year", () => {
    const receipts = [
      receipt({
        id: "nec",
        timestamp: new Date("2025-06-01T12:00:00.000Z"),
        amount: 64800,
        category: "1099-NEC",
        deductible: false,
      }),
      receipt({
        id: "k",
        timestamp: new Date("2025-08-01T12:00:00.000Z"),
        amount: 1200,
        category: "1099-K",
        deductible: false,
      }),
      receipt({
        id: "exp",
        timestamp: new Date("2025-07-01T12:00:00.000Z"),
        amount: 50,
        category: "TOOLS",
      }),
    ];
    assert.equal(totalIncomeGrossInTaxYear(receipts, 2025, "UTC"), 66000);
    assert.equal(incomeFormsInTaxYear(receipts, 2025, "UTC"), 2);
  });

  it("uses 1099 form tax year instead of capture year for stats", () => {
    const receipts = [
      receipt({
        id: "nec",
        timestamp: new Date("2025-01-15T12:00:00.000Z"),
        amount: 50000,
        category: "1099-NEC",
        incomeTaxYear: 2024,
        deductible: false,
      }),
    ];
    assert.equal(incomeFormsInTaxYear(receipts, 2024, "UTC"), 1);
    assert.equal(incomeFormsInTaxYear(receipts, 2025, "UTC"), 0);
    assert.equal(totalIncomeGrossInTaxYear(receipts, 2024, "UTC"), 50000);
  });
});

function r(partial: Partial<Receipt> & Pick<Receipt, "id" | "timestamp">): Receipt {
  return { status: "processing", ...partial };
}

describe("taxYearStats extensions", () => {
  it("effectiveReceiptTaxYear uses incomeTaxYear for 1099 forms", () => {
    const year = effectiveReceiptTaxYear(
      r({
        id: "1",
        timestamp: new Date("2026-06-01T12:00:00.000Z"),
        category: "1099-NEC",
        incomeTaxYear: 2025,
      }),
      "America/New_York",
    );
    assert.equal(year, 2025);
  });

  it("countReceiptsInTaxYearAllStatuses includes processing", () => {
    const tz = "UTC";
    const receipts = [
      r({ id: "a", timestamp: new Date("2026-01-01T00:00:00.000Z"), status: "processing" }),
      r({ id: "b", timestamp: new Date("2026-01-02T00:00:00.000Z"), status: "done" }),
      r({ id: "c", timestamp: new Date("2025-01-01T00:00:00.000Z"), status: "done" }),
    ];
    assert.equal(countReceiptsInTaxYearAllStatuses(receipts, 2026, tz), 2);
  });
});
