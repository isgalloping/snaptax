import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { unzipSync } from "fflate";
import { assignAuditTrailMeta } from "@/lib/export/assignAuditTrailMeta";
import { buildLocalCpaPackZip } from "@/lib/export/buildLocalCpaPackZip";
import type { ExportIncomeRow } from "@/lib/export/incomeDocuments";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

function sampleExpenseRow(
  overrides: Partial<ExportExpenseRow> = {},
): ExportExpenseRow {
  return assignAuditTrailMeta([
    {
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
    },
  ])[0]!;
}

function sampleIncomeRow(overrides: Partial<ExportIncomeRow> = {}): ExportIncomeRow {
  return {
    id: "00000000-0000-0000-0000-000000000002",
    dateIso: "2026-01-31",
    payer: "Acme Contracting",
    amount: 4800,
    formType: "1099-NEC",
    taxYear: 2025,
    imagePathname: "receipts/acme-1099.jpg",
    incomeArchivePath: "01_Income_Documents/1099_NEC_Acme_20260131.jpg",
    ...overrides,
  };
}

function zipEntryNames(chunks: Uint8Array[]): string[] {
  const merged = new Uint8Array(
    chunks.reduce((sum, chunk) => sum + chunk.length, 0),
  );
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return Object.keys(unzipSync(merged));
}

describe("buildLocalCpaPackZip", () => {
  it("packs summary PDF, detail CSV, and resolved receipt images", async () => {
    const progress: { completed: number; total: number }[] = [];
    const expenseRow = sampleExpenseRow();
    const images = new Map<string, Blob>([
      [
        expenseRow.id,
        new Blob(["expense-image"], { type: "image/jpeg" }),
      ],
      [
        sampleIncomeRow().id,
        new Blob(["income-image"], { type: "image/jpeg" }),
      ],
    ]);

    const result = await buildLocalCpaPackZip(
      "Date,Merchant,Amount\r\n2026-03-15,Home Depot,125.50",
      new TextEncoder().encode("%PDF-1.7\nsummary"),
      [expenseRow],
      [sampleIncomeRow()],
      "2025",
      async (receiptId) => images.get(receiptId) ?? null,
      (event) => progress.push({ completed: event.completed, total: event.total }),
    );

    const names = zipEntryNames(result.chunks);
    assert.ok(result.chunks.length >= 1);
    assert.ok(names.includes("2025_Tax_Report_Summary.pdf"));
    assert.ok(names.includes("2025_Tax_Report_Data.csv"));
    assert.ok(names.includes("01_Income_Documents/1099_NEC_Acme_20260131.jpg"));
    assert.ok(names.includes(expenseRow.receiptArchivePath));
    assert.equal(result.imageStats.imagesEligible, 2);
    assert.equal(result.imageStats.imagesIncluded, 2);
    assert.equal(progress.at(-1)?.completed, 2);
  });
});
