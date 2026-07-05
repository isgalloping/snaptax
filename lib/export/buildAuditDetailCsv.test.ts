import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAuditDetailCsv } from "./buildAuditDetailCsv.ts";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

function sampleRow(
  overrides: Partial<ExportExpenseRow> = {},
): ExportExpenseRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    date: "03/15/2026",
    dateIso: "2026-03-15",
    merchant: "Home Depot",
    amount: 125.5,
    category: "SUPPLIES",
    irsSchedule: "Schedule C - Line 22 (Supplies)",
    irsLine: "Line 22",
    deductibleAmount: 125.5,
    deductible: true,
    taxSaved: 31.38,
    notes: "",
    imagePathname: "receipts/home-depot.jpg",
    receiptImageUrl: "",
    categoryDisplay: "Supplies",
    scheduleCLine: "Line 22",
    taxDeductible: "Yes",
    businessPercent: "100%",
    exportAmount: 125.5,
    receiptAlias: "REC_20260315_HomeDepot_125.50.jpg",
    receiptArchivePath: "",
    ...overrides,
  };
}

describe("buildAuditDetailCsv", () => {
  it("includes IRS_Line and one row per receipt", () => {
    const path = "Line_22_Supplies/20260315_HomeDepot_$125.50_001.jpg";
    const csv = buildAuditDetailCsv([
      sampleRow({ auditImagePath: path }),
      sampleRow({
        id: "00000000-0000-0000-0000-000000000002",
        merchant: "Pizza Hut",
        category: "MEALS",
        irsLine: "Line 24b",
        scheduleCLine: "Line 24b",
        categoryDisplay: "Meals",
        exportAmount: 6.08,
        auditImagePath:
          "Line_24b_Deductible_meals/20260705_Pizza_Hut_$6.08_004.jpg",
      }),
    ]);
    const lines = csv.split("\r\n");
    assert.equal(lines.length, 3);
    assert.equal(
      lines[0],
      "Date,IRS_Line,Category,Merchant,Amount,Memo,Audit_Image_Path,Receipt_Image_URL",
    );
    assert.equal(
      lines[1],
      `2026-03-15,22,Supplies,Home Depot,125.50,,${path},${path}`,
    );
    assert.equal(
      lines[2],
      "2026-03-15,24b,Meals,Pizza Hut,6.08,,Line_24b_Deductible_meals/20260705_Pizza_Hut_$6.08_004.jpg,Line_24b_Deductible_meals/20260705_Pizza_Hut_$6.08_004.jpg",
    );
  });

  it("includes Audit_Image_Path and Receipt_Image_URL with same value", () => {
    const path = "Line_22_Supplies/20260315_HomeDepot_$125.50_001.jpg";
    const csv = buildAuditDetailCsv([sampleRow({ auditImagePath: path })]);
    assert.match(csv, /Audit_Image_Path/);
    assert.match(csv, /Receipt_Image_URL/);
    const lines = csv.split("\r\n");
    assert.equal(lines.length, 2);
    assert.ok(lines[1]!.includes(path));
    const pathCount = (lines[1]!.match(/Line_22_Supplies/g) ?? []).length;
    assert.equal(pathCount, 2);
  });

  it("returns header only when no rows", () => {
    const csv = buildAuditDetailCsv([]);
    assert.equal(
      csv,
      "Date,IRS_Line,Category,Merchant,Amount,Memo,Audit_Image_Path,Receipt_Image_URL",
    );
  });
});
