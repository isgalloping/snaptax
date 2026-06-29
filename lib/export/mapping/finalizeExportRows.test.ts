import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { buildTurboTaxCsv } from "@/lib/tax/exportCsv";
import { finalizeExportRows } from "@/lib/export/mapping/finalizeExportRows";
import {
  buildReceiptAlias,
  sanitizeMerchantForFilename,
} from "@/lib/export/mapping/receiptNaming";

function sampleRow(overrides: Partial<ExportExpenseRow> = {}): ExportExpenseRow {
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

describe("sanitizeMerchantForFilename", () => {
  it("strips spaces and punctuation from merchant names", () => {
    assert.equal(sanitizeMerchantForFilename("Home Depot"), "HomeDepot");
    assert.equal(sanitizeMerchantForFilename("Chevron Gas"), "ChevronGas");
  });
});

describe("buildReceiptAlias", () => {
  it("matches export-biz REC naming pattern", () => {
    const alias = buildReceiptAlias({
      dateIso: "2026-03-15",
      merchant: "Home Depot",
      amount: 125.5,
    });
    assert.equal(alias, "REC_20260315_HomeDepot_125.50.jpg");
  });
});

describe("finalizeExportRows", () => {
  it("maps supplies row to TurboTax golden format", () => {
    const [row] = finalizeExportRows([sampleRow()]);
    const csv = buildTurboTaxCsv([row!]);
    assert.ok(!csv.startsWith("\uFEFF"), "TurboTax CSV must not include BOM");
    assert.match(
      csv,
      /^Date,Merchant,Category,Amount,Schedule C Line,Tax Deductible,Business %,Receipt_Image_URL/,
    );
    assert.match(
      csv,
      /2026-03-15,Home Depot,Supplies,125\.50,Line 22,Yes,100%,REC_20260315_HomeDepot_125\.50\.jpg/,
    );
  });

  it("marks zero-deductible rows as Personal", () => {
    const [row] = finalizeExportRows([
      sampleRow({
        category: "PERSONAL",
        deductible: false,
        deductibleAmount: 0,
      }),
    ]);
    assert.equal(row!.categoryDisplay, "Personal");
    assert.equal(row!.taxDeductible, "No");
    assert.equal(row!.businessPercent, "0%");
  });

  it("dedupes repeated rows for the same receipt id", () => {
    const rows = finalizeExportRows([
      sampleRow(),
      sampleRow(),
    ]);
    assert.equal(rows.length, 1);
  });

  it("keeps separate receipts with the same merchant, date, and amount", () => {
    const rows = finalizeExportRows([
      sampleRow(),
      sampleRow({ id: "00000000-0000-0000-0000-000000000002" }),
    ]);

    assert.equal(rows.length, 2);
    assert.equal(rows[0]!.receiptAlias, "REC_20260315_HomeDepot_125.50.jpg");
    assert.equal(rows[1]!.receiptAlias, "REC_20260315_HomeDepot_125.50_2.jpg");
  });

  it("aligns with docs/biz/export/TurboTax-format.csv demo row", () => {
    const goldenPath = join(
      process.cwd(),
      "docs/biz/export/TurboTax-format.csv",
    );
    const golden = readFileSync(goldenPath, "utf-8")
      .trim()
      .split(/\r?\n/);
    const header = golden[0]!;
    const demoLine = golden[4]!; // Home Depot Supplies row

    const [row] = finalizeExportRows([
      sampleRow({
        dateIso: "2026-03-15",
        merchant: "Home Depot",
        amount: 125.5,
        deductibleAmount: 125.5,
      }),
    ]);
    const csv = buildTurboTaxCsv([row!]);
    const dataLine = csv.split("\r\n")[1]!;

    assert.equal(
      header + ",Receipt_Image_URL",
      "Date,Merchant,Category,Amount,Schedule C Line,Tax Deductible,Business %,Receipt_Image_URL",
    );
    assert.equal(
      dataLine,
      `${demoLine},REC_20260315_HomeDepot_125.50.jpg`,
    );
  });
});
