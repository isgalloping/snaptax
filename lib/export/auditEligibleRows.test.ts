import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { auditEligibleRows, exportEligibleRows, hasAuditExportContent } from "./auditEligibleRows.ts";

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

describe("exportEligibleRows", () => {
  it("includes rows with taxDeductible Yes and exportAmount > 0", () => {
    const rows = exportEligibleRows([
      row({ taxDeductible: "Yes", exportAmount: 50, deductibleAmount: 50 }),
    ]);
    assert.equal(rows.length, 1);
  });

  it("excludes Personal / zero exportAmount", () => {
    const rows = exportEligibleRows([
      row({}),
      row({ taxDeductible: "Yes", exportAmount: 0 }),
    ]);
    assert.equal(rows.length, 0);
  });

  it("excludes taxDeductible No even when deductible boolean is true", () => {
    const rows = exportEligibleRows([
      row({ deductible: true, taxDeductible: "No", exportAmount: 100 }),
    ]);
    assert.equal(rows.length, 0);
  });
});

describe("auditEligibleRows", () => {
  it("includes deductible rows with exportAmount > 0", () => {
    const rows = auditEligibleRows([
      row({ taxDeductible: "Yes", exportAmount: 50, deductibleAmount: 50 }),
    ]);
    assert.equal(rows.length, 1);
  });

  it("excludes Personal / zero exportAmount", () => {
    const rows = auditEligibleRows([
      row({}),
      row({ taxDeductible: "Yes", exportAmount: 0 }),
    ]);
    assert.equal(rows.length, 0);
  });

  it("matches exportEligibleRows", () => {
    const input = [
      row({ taxDeductible: "Yes", exportAmount: 10 }),
      row({ taxDeductible: "No", exportAmount: 99, deductible: true }),
    ];
    assert.deepEqual(auditEligibleRows(input), exportEligibleRows(input));
  });
});

describe("hasAuditExportContent", () => {
  it("is false when both audit and income are empty", () => {
    assert.equal(hasAuditExportContent([], []), false);
  });

  it("is true when audit rows exist", () => {
    assert.equal(
      hasAuditExportContent(
        [row({ deductible: true, exportAmount: 10, deductibleAmount: 10 })],
        [],
      ),
      true,
    );
  });

  it("is true when only income rows exist", () => {
    assert.equal(hasAuditExportContent([], [{}]), true);
  });
});
