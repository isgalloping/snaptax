import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auditEligibleRows } from "./auditEligibleRows.ts";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

function row(partial: Partial<ExportExpenseRow>): ExportExpenseRow {
  return {
    id: "1",
    date: "01/01/2026",
    dateIso: "2026-01-01",
    merchant: "Test",
    amount: 10,
    category: "OTHER",
    irsSchedule: "",
    irsLine: "Line 27a",
    deductibleAmount: 0,
    deductible: false,
    taxSaved: 0,
    notes: "",
    imagePathname: null,
    receiptImageUrl: "",
    categoryDisplay: "Personal",
    scheduleCLine: "",
    taxDeductible: "No",
    businessPercent: "0%",
    exportAmount: 0,
    receiptAlias: "",
    receiptArchivePath: "",
    ...partial,
  };
}

describe("auditEligibleRows", () => {
  it("includes deductible rows with exportAmount > 0", () => {
    const rows = auditEligibleRows([
      row({ deductible: true, exportAmount: 50, deductibleAmount: 50 }),
    ]);
    assert.equal(rows.length, 1);
  });

  it("excludes Personal / zero exportAmount", () => {
    const rows = auditEligibleRows([
      row({}),
      row({ exportAmount: 0, deductible: true }),
    ]);
    assert.equal(rows.length, 0);
  });
});
