import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { buildQifExport } from "@/lib/export/buildQifExport";

function sampleRow(overrides: Partial<ExportExpenseRow> = {}): ExportExpenseRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    date: "12/14/2025",
    dateIso: "2025-12-14",
    merchant: "Shell Gas",
    amount: 75.5,
    category: "VEHICLE",
    irsSchedule: "Schedule C - Line 9 (Car and truck expenses)",
    irsLine: "Line 9",
    deductibleAmount: 75.5,
    deductible: true,
    taxSaved: 18,
    notes: "Truck Fuel",
    imagePathname: null,
    receiptImageUrl: "",
    categoryDisplay: "Car & Truck",
    scheduleCLine: "Line 9",
    taxDeductible: "Yes",
    businessPercent: "100%",
    exportAmount: 75.5,
    receiptAlias: "REC_20251214_Shell_75.50.jpg",
    receiptArchivePath: "",
    ...overrides,
  };
}

describe("buildQifExport", () => {
  it("starts with Cash account header and expense block", () => {
    const qif = buildQifExport([sampleRow()]);
    assert.match(qif, /^!Type:Cash\n!Account:SnapTax Expenses\n/);
    assert.match(
      qif,
      /D12\/14\/2025\nT-75\.50\nPShell Gas\nLJob Expenses:Car & Truck \(Line 9\)\nM.*Truck Fuel\n\^/,
    );
  });

  it("embeds stable FITID prefix in memo", () => {
    const qif = buildQifExport([sampleRow({ notes: "" })]);
    assert.match(qif, /MSNPTX00000000000000000000000000000001\n\^/);
  });

  it("skips non-deductible rows", () => {
    const qif = buildQifExport([
      sampleRow({ taxDeductible: "No", exportAmount: 0 }),
    ]);
    assert.equal(qif.split("^").length, 1);
  });

  it("aligns with PRD QIF field order", () => {
    const qif = buildQifExport([
      sampleRow({
        merchant: "Home Depot",
        dateIso: "2025-10-25",
        exportAmount: 340,
        categoryDisplay: "Supplies",
        scheduleCLine: "Line 22",
        notes: "DeWalt Drill",
      }),
    ]);
    assert.match(
      qif,
      /D10\/25\/2025\nT-340\.00\nPHome Depot\nLJob Expenses:Supplies \(Line 22\)\nM.*DeWalt Drill\n\^/,
    );
  });
});
