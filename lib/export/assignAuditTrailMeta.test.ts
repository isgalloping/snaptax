import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assignAuditTrailMeta } from "./assignAuditTrailMeta.ts";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

function sampleRow(overrides: Partial<ExportExpenseRow> = {}): ExportExpenseRow {
  return {
    id: "a",
    date: "03/15/2026",
    dateIso: "2026-03-15",
    merchant: "Home Depot",
    amount: 125.5,
    category: "SUPPLIES",
    irsSchedule: "",
    irsLine: "Line 22",
    deductibleAmount: 125.5,
    deductible: true,
    taxSaved: 31,
    notes: "",
    imagePathname: "receipts/hd.jpg",
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

describe("assignAuditTrailMeta", () => {
  it("assigns global 001..N index and paths in input order", () => {
    const [first, second] = assignAuditTrailMeta([
      sampleRow(),
      sampleRow({
        id: "b",
        merchant: "Shell",
        scheduleCLine: "Line 9",
        exportAmount: 45.5,
        deductibleAmount: 45.5,
      }),
    ]);

    assert.equal(first.auditIndex, "001");
    assert.match(first.auditImagePath!, /_001\.jpg$/);
    assert.equal(first.receiptArchivePath, first.auditImagePath);
    assert.equal(second.auditIndex, "002");
    assert.match(second.auditImagePath!, /Line_09_Car_and_truck_expenses/);
  });
});
