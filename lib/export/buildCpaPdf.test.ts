import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCpaSummaryPdf } from "@/lib/export/buildCpaPdf";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

function sampleRow(overrides: Partial<ExportExpenseRow> = {}): ExportExpenseRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    date: "03/15/2026",
    dateIso: "2026-03-15",
    merchant: "Home Depot",
    amount: 120,
    category: "SUPPLIES",
    irsSchedule: "Supplies",
    irsLine: "Line 22",
    deductibleAmount: 120,
    deductible: true,
    taxSaved: 30,
    notes: "",
    imagePathname: "/receipts/test.jpg",
    receiptImageUrl: "https://example.com/receipt.jpg",
    ...overrides,
  };
}

describe("buildCpaSummaryPdf", () => {
  it("returns a valid PDF buffer with standard fonts", async () => {
    const rows = [
      sampleRow(),
      sampleRow({
        id: "00000000-0000-0000-0000-000000000002",
        merchant: "Shell",
        category: "VEHICLE",
        irsLine: "Line 9",
        amount: 45.5,
        deductibleAmount: 45.5,
        receiptImageUrl: "",
      }),
    ];
    const summaryLines = [{ line: "Line 22", total: 120 }];

    const buffer = await buildCpaSummaryPdf("2026", rows, summaryLines);

    assert.ok(buffer.length > 100);
    assert.equal(buffer.subarray(0, 5).toString(), "%PDF-");
  });
});
