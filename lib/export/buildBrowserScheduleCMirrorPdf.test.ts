import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assignAuditTrailMeta } from "@/lib/export/assignAuditTrailMeta";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import {
  buildBrowserScheduleCMirrorPdf,
  toPdfSafeText,
} from "./buildBrowserScheduleCMirrorPdf.ts";

function sampleAuditRow(merchant: string): ExportExpenseRow {
  return assignAuditTrailMeta([
    {
      id: "00000000-0000-0000-0000-000000000001",
      date: "03/15/2026",
      dateIso: "2026-03-15",
      merchant,
      amount: 80,
      category: "SUPPLIES",
      irsSchedule: "Schedule C - Line 22 (Supplies)",
      irsLine: "Line 22",
      deductibleAmount: 80,
      deductible: true,
      taxSaved: 20,
      notes: "",
      imagePathname: null,
      receiptImageUrl: "",
      categoryDisplay: "Supplies",
      scheduleCLine: "Line 22",
      taxDeductible: "Yes",
      businessPercent: "100%",
      exportAmount: 80,
      receiptAlias: "",
      receiptArchivePath: "",
    },
  ])[0]!;
}

describe("toPdfSafeText", () => {
  it("replaces CJK and emoji with placeholders", () => {
    assert.match(toPdfSafeText("日本語🚚 Shop"), /^\?+ Shop$/);
  });
});

describe("buildBrowserScheduleCMirrorPdf", () => {
  it("returns a valid PDF byte array", async () => {
    const bytes = await buildBrowserScheduleCMirrorPdf({
      taxYear: "2025",
      taxpayerName: "Jane Contractor",
      businessIndustry: "Independent Contractor",
      auditRows: [],
      incomeRows: [],
    });
    assert.equal(String.fromCharCode(...bytes.subarray(0, 5)), "%PDF-");
    assert.ok(bytes.length > 500);
  });

  it("generates PDF with non-WinAnsi merchant names", async () => {
    const bytes = await buildBrowserScheduleCMirrorPdf({
      taxYear: "2025",
      taxpayerName: "日本語",
      businessIndustry: "Independent Contractor",
      auditRows: [sampleAuditRow("Shell 🚚")],
      incomeRows: [],
    });
    assert.equal(String.fromCharCode(...bytes.subarray(0, 5)), "%PDF-");
    assert.ok(bytes.length > 500);
  });
});
