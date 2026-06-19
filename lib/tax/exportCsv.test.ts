import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { buildExpensesCsv, buildTurboTaxCsv } from "@/lib/tax/exportCsv";
import { finalizeExportRows } from "@/lib/export/mapping/finalizeExportRows";

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
    receiptImageUrl: "",
    categoryDisplay: "",
    scheduleCLine: "",
    taxDeductible: "",
    businessPercent: "",
    exportAmount: 0,
    receiptAlias: "",
    receiptArchivePath: "",
    ...overrides,
  };
}

describe("buildTurboTaxCsv", () => {
  it("uses RFC 4180 headers without BOM and REC alias URLs", () => {
    const [row] = finalizeExportRows([sampleRow()]);
    const csv = buildTurboTaxCsv([row!]);
    assert.ok(!csv.startsWith("\uFEFF"));
    assert.match(
      csv,
      /^Date,Merchant,Category,Amount,Schedule C Line,Tax Deductible,Business %,Receipt_Image_URL/,
    );
    assert.match(
      csv,
      /2025-03-01,Home Depot,Supplies,120\.00,Line 22,Yes,100%,REC_20250301_HomeDepot_120\.00\.jpg/,
    );
  });
});

describe("buildExpensesCsv", () => {
  it("includes archive-relative receipt path for CPA pack", () => {
    const [row] = finalizeExportRows([sampleRow()]);
    const csv = buildExpensesCsv([row!], "archive");
    assert.match(csv, /Receipt Image URL/);
    assert.match(
      csv,
      /02_Expenses_Receipts_Book\/Line_22_Supplies\/REC_20250301_HomeDepot_120\.00\.jpg/,
    );
  });
});
