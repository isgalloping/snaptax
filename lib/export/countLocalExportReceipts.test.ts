import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import { countLocalExportReceiptsInTaxYear } from "./countLocalExportReceipts.ts";

describe("countLocalExportReceiptsInTaxYear", () => {
  it("counts done expense receipts in the capture tax year", () => {
    const receipts: Receipt[] = [
      {
        id: "1",
        status: "done",
        amount: 50,
        merchant: "Shell",
        category: "VEHICLE",
        taxAmount: 10,
        deductible: true,
        timestamp: new Date("2026-04-10T12:00:00.000Z"),
      },
    ];
    assert.equal(countLocalExportReceiptsInTaxYear(receipts, 2026, "UTC"), 1);
    assert.equal(countLocalExportReceiptsInTaxYear(receipts, 2025, "UTC"), 0);
  });

  it("uses incomeTaxYear for 1099 forms", () => {
    const receipts: Receipt[] = [
      {
        id: "2",
        status: "done",
        amount: 1000,
        merchant: "Acme",
        category: "1099-NEC",
        incomeTaxYear: 2025,
        taxAmount: 0,
        deductible: false,
        timestamp: new Date("2026-01-15T12:00:00.000Z"),
      },
    ];
    assert.equal(countLocalExportReceiptsInTaxYear(receipts, 2025, "UTC"), 1);
    assert.equal(countLocalExportReceiptsInTaxYear(receipts, 2026, "UTC"), 0);
  });

  it("excludes non-done receipts", () => {
    const receipts: Receipt[] = [
      {
        id: "3",
        status: "processing",
        amount: 50,
        merchant: "Shell",
        category: "VEHICLE",
        taxAmount: 10,
        deductible: true,
        timestamp: new Date("2026-04-10T12:00:00.000Z"),
      },
    ];
    assert.equal(countLocalExportReceiptsInTaxYear(receipts, 2026, "UTC"), 0);
  });
});
