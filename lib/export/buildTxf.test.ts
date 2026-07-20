import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { buildTxfExport } from "@/lib/export/buildTxf";

function sampleRow(overrides: Partial<ExportExpenseRow> = {}): ExportExpenseRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    date: "01/15/2026",
    dateIso: "2026-01-15",
    merchant: "OpenAI",
    amount: 20,
    category: "OTHER",
    irsSchedule: "Schedule C - Line 27a (Other expenses)",
    irsLine: "Line 27a",
    deductibleAmount: 20,
    deductible: true,
    taxSaved: 5,
    notes: "",
    imagePathname: null,
    receiptImageUrl: "",
    categoryDisplay: "Other expenses",
    scheduleCLine: "Line 27a",
    taxDeductible: "Yes",
    businessPercent: "100%",
    exportAmount: 20,
    receiptAlias: "REC_20260115_OpenAI_20.00.jpg",
    receiptArchivePath: "",
    ...overrides,
  };
}

describe("buildTxfExport", () => {
  it("starts with V042 header and expense block", () => {
    const txf = buildTxfExport(
      [sampleRow()],
      new Date("2026-02-15T12:00:00.000Z"),
    );
    assert.match(txf, /^V042\nSnapTax Export\nD 02\/15\/2026\n/);
    assert.match(txf, /\^[\s\S]*TD 2222[\s\S]*P OpenAI[\s\S]*D 01\/15\/2026[\s\S]*M 1099 Business Expense[\s\S]*\$ 20\.00/);
  });

  it("skips non-deductible rows", () => {
    const txf = buildTxfExport([
      sampleRow({ taxDeductible: "No", exportAmount: 0 }),
    ]);
    assert.equal(txf.split("^").length, 1);
  });

  it("uses TD 2213 for domain merchants", () => {
    const txf = buildTxfExport([
      sampleRow({
        merchant: "Google Domains",
        dateIso: "2026-02-10",
        exportAmount: 12.5,
      }),
    ]);
    assert.match(txf, /TD 2213[\s\S]*Google Domains[\s\S]*\$ 12\.50/);
  });

  it("aligns with txf-format.txt demo blocks and excludes mileage", () => {
    const txf = buildTxfExport(
      [
        sampleRow({
          merchant: "OpenAI API Subscription",
          dateIso: "2026-01-15",
          exportAmount: 20,
        }),
        sampleRow({
          merchant: "Google Domains",
          dateIso: "2026-02-10",
          exportAmount: 12.5,
        }),
      ],
      new Date("2026-02-15T12:00:00.000Z"),
    );
    assert.match(
      txf,
      /TD 2222[\s\S]*OpenAI API Subscription[\s\S]*D 01\/15\/2026[\s\S]*\$ 20\.00/,
    );
    assert.match(
      txf,
      /TD 2213[\s\S]*Google Domains[\s\S]*D 02\/10\/2026[\s\S]*\$ 12\.50/,
    );
    assert.ok(!txf.includes("4800 Miles"), "no mileage aggregate row");
    assert.ok(!/TD 2214[\s\S]*Mileage/.test(txf), "no TD 2214 mileage block");
  });
});
