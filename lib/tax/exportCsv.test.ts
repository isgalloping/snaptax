import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { buildExpensesCsv, buildTurboTaxCsv } from "@/lib/tax/exportCsv";
import { irsCategoryExportLabel } from "@/lib/tax/irsScheduleLabel";

function sampleRow(overrides: Partial<ExportExpenseRow> = {}): ExportExpenseRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    date: "03/01/2025",
    dateIso: "2025-03-01",
    merchant: "Home Depot",
    amount: 120,
    category: "SUPPLIES",
    irsSchedule: "Schedule C - Line 22 (Supplies)",
    irsLine: "Line 22",
    deductibleAmount: 120,
    deductible: true,
    taxSaved: 24,
    notes: "",
    imagePathname: "receipts/test.jpg",
    receiptImageUrl: "https://example.com/receipt.jpg",
    ...overrides,
  };
}

describe("irsCategoryExportLabel", () => {
  it("formats supplies as Line 22 label", () => {
    assert.equal(irsCategoryExportLabel("SUPPLIES"), "Line 22: Supplies");
  });

  it("formats meals as Line 24b label", () => {
    assert.equal(
      irsCategoryExportLabel("MEALS"),
      "Line 24b: Deductible business meals",
    );
  });
});

describe("buildTurboTaxCsv", () => {
  it("uses RFC 4180 headers and ISO dates", () => {
    const csv = buildTurboTaxCsv([sampleRow()]);
    assert.match(csv, /^\uFEFFDate,Vendor,Amount,IRS_Category,Deductible_Amount,Receipt_Image_URL/);
    assert.match(csv, /2025-03-01,Home Depot,120\.00,Line 22: Supplies,120\.00,https:\/\/example\.com\/receipt\.jpg/);
  });
});

describe("buildExpensesCsv", () => {
  it("includes receipt image URL in full export", () => {
    const csv = buildExpensesCsv([sampleRow()]);
    assert.match(csv, /Receipt Image URL/);
    assert.match(csv, /https:\/\/example\.com\/receipt\.jpg/);
  });
});
