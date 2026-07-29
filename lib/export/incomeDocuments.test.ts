import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SnaptaxReceipt } from "@prisma/client";
import {
  buildExportIncomeRow,
  buildIncomeArchivePath,
  extractIncomeTaxYearFromAiRaw,
  isIncomeDocument,
} from "@/lib/export/incomeDocuments";
import { stubSnaptaxReceipt } from "@/lib/receipts/snaptaxReceiptStub";

function incomeReceipt(
  overrides: Partial<SnaptaxReceipt> = {},
): SnaptaxReceipt {
  return stubSnaptaxReceipt({
    userId: "user",
    imageUrl: "receipts/1099.jpg",
    amount: 64800 as unknown as SnaptaxReceipt["amount"],
    merchantName: "Client A",
    category: "1099-NEC",
    taxAmount: 0 as unknown as SnaptaxReceipt["taxAmount"],
    aiRaw: { document_kind: "1099-NEC", payer: "Client A" },
    capturedAt: new Date("2025-12-31T12:00:00.000Z"),
    snapAt: new Date("2025-12-31T12:00:00.000Z"),
    contentSha256: "abc",
    ...overrides,
  });
}

describe("isIncomeDocument", () => {
  it("detects 1099-NEC category", () => {
    assert.equal(isIncomeDocument({ category: "1099-NEC" }), true);
  });

  it("detects document_kind in aiRaw", () => {
    assert.equal(
      isIncomeDocument({ aiRaw: { document_kind: "1099-K" } }),
      true,
    );
  });
});

describe("extractIncomeTaxYearFromAiRaw", () => {
  it("returns form tax year when present", () => {
    assert.equal(
      extractIncomeTaxYearFromAiRaw({ tax_year: 2024, document_kind: "1099-NEC" }),
      2024,
    );
  });

  it("returns null for invalid values", () => {
    assert.equal(extractIncomeTaxYearFromAiRaw({ tax_year: "2024" }), null);
    assert.equal(extractIncomeTaxYearFromAiRaw(null), null);
  });
});

describe("buildExportIncomeRow", () => {
  it("builds income archive path under 01_Income_Documents", () => {
    const row = buildExportIncomeRow(incomeReceipt(), "UTC");
    assert.ok(row);
    assert.equal(row!.formType, "1099-NEC");
    assert.equal(row!.taxYear, null);
    assert.match(
      row!.incomeArchivePath,
      /^01_Income_Documents\/1099_NEC_ClientA_20251231_00000000000000000000000000000001\.jpg$/,
    );
  });

  it("includes tax year from aiRaw", () => {
    const row = buildExportIncomeRow(
      incomeReceipt({ aiRaw: { document_kind: "1099-NEC", tax_year: 2024 } }),
      "UTC",
    );
    assert.equal(row!.taxYear, 2024);
  });

  it("keeps archive paths unique for same-day forms from the same payer", () => {
    const first = buildExportIncomeRow(
      incomeReceipt({ id: "00000000-0000-0000-0000-000000000101" }),
      "UTC",
    );
    const second = buildExportIncomeRow(
      incomeReceipt({ id: "00000000-0000-0000-0000-000000000202" }),
      "UTC",
    );

    assert.ok(first);
    assert.ok(second);
    assert.notEqual(first!.incomeArchivePath, second!.incomeArchivePath);
  });
});

describe("buildIncomeArchivePath", () => {
  it("sanitizes payer names", () => {
    const path = buildIncomeArchivePath({
      formType: "1099-NEC",
      payer: "Acme Corp.",
      dateIso: "2025-01-15",
    });
    assert.equal(path, "01_Income_Documents/1099_NEC_AcmeCorp_20250115.jpg");
  });
});
