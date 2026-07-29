import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { buildQboExport } from "@/lib/export/buildQboExport";

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

const exportedAt = new Date("2026-04-15T00:00:00.000Z");

describe("buildQboExport", () => {
  it("starts with OFX header and INTU.BID for QuickBooks Online", () => {
    const qbo = buildQboExport([sampleRow()], exportedAt);
    assert.match(qbo, /^OFXHEADER:100\nDATA:OFXSGML\n/);
    assert.match(qbo, /<INTU\.BID>3000<\/INTU\.BID>/);
    assert.match(qbo, /<DTSERVER>20260415000000<\/DTSERVER>/);
  });

  it("emits DEBIT stmttrn with negative amount and stable FITID", () => {
    const qbo = buildQboExport([sampleRow()], exportedAt);
    assert.match(
      qbo,
      /<STMTTRN>\n<TRNTYPE>DEBIT<\/TRNTYPE>\n<DTPOSTED>20251214000000<\/DTPOSTED>\n<TRNAMT>-75\.50<\/TRNAMT>\n<FITID>SNPTX00000000000000000000000000000001<\/FITID>\n<NAME>Shell Gas<\/NAME>\n<MEMO>Line 9 - Car &amp; Truck · Truck Fuel<\/MEMO>\n<\/STMTTRN>/,
    );
  });

  it("skips non-deductible rows", () => {
    const qbo = buildQboExport(
      [sampleRow({ taxDeductible: "No", exportAmount: 0 })],
      exportedAt,
    );
    assert.doesNotMatch(qbo, /<STMTTRN>/);
  });

  it("aligns with PRD QBO field mapping", () => {
    const qbo = buildQboExport(
      [
        sampleRow({
          merchant: "Home Depot",
          dateIso: "2025-10-25",
          exportAmount: 340,
          categoryDisplay: "Supplies",
          scheduleCLine: "Line 22",
          notes: "DeWalt Drill",
        }),
      ],
      exportedAt,
    );
    assert.match(qbo, /<DTPOSTED>20251025000000<\/DTPOSTED>/);
    assert.match(qbo, /<TRNAMT>-340\.00<\/TRNAMT>/);
    assert.match(qbo, /<NAME>Home Depot<\/NAME>/);
    assert.match(qbo, /<MEMO>Line 22 - Supplies · DeWalt Drill<\/MEMO>/);
  });

  it("truncates merchant NAME to 32 characters", () => {
    const qbo = buildQboExport(
      [
        sampleRow({
          merchant: "A".repeat(40),
        }),
      ],
      exportedAt,
    );
    assert.match(qbo, /<NAME>A{32}<\/NAME>/);
  });

  it("escapes XML special characters in NAME", () => {
    const qbo = buildQboExport([sampleRow({ merchant: "AT&T" })], exportedAt);
    assert.match(qbo, /<NAME>AT&amp;T<\/NAME>/);
  });

  it("escapes XML special characters in MEMO category and notes", () => {
    const qbo = buildQboExport(
      [
        sampleRow({
          categoryDisplay: "Meals & Tools <Fuel>",
          notes: "A < B & C > D",
        }),
      ],
      exportedAt,
    );

    assert.match(
      qbo,
      /<MEMO>Line 9 - Meals &amp; Tools &lt;Fuel&gt; · A &lt; B &amp; C &gt; D<\/MEMO>/,
    );
  });

  it("omits the notes separator and falls back to Other expenses when memo details are blank", () => {
    const qbo = buildQboExport(
      [
        sampleRow({
          categoryDisplay: "  ",
          notes: "  ",
          scheduleCLine: undefined,
        }),
      ],
      exportedAt,
    );

    assert.match(qbo, /<MEMO>Expense - Other expenses<\/MEMO>/);
    assert.doesNotMatch(qbo, /Other expenses ·/);
  });
});
