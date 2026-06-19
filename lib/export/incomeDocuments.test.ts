import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SnaptaxReceipt } from "@prisma/client";
import {
  buildExportIncomeRow,
  buildIncomeArchivePath,
  extractIncomeTaxYearFromAiRaw,
  isIncomeDocument,
} from "@/lib/export/incomeDocuments";

function incomeReceipt(
  overrides: Partial<SnaptaxReceipt> = {},
): SnaptaxReceipt {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    userId: "user",
    ghostId: null,
    imageUrl: "receipts/1099.jpg",
    status: "done",
    amount: 64800 as unknown as SnaptaxReceipt["amount"],
    currency: "USD",
    merchantName: "Client A",
    category: "1099-NEC",
    deductible: true,
    taxAmount: 0 as unknown as SnaptaxReceipt["taxAmount"],
    dataRegion: "us",
    aiRaw: { document_kind: "1099-NEC", payer: "Client A" },
    capturedAt: new Date("2025-12-31T12:00:00.000Z"),
    snapAt: new Date("2025-12-31T12:00:00.000Z"),
    processedAt: null,
    taxSeason: null,
    taxSeasonDate: null,
    contentSha256: "abc",
    imageFingerprint: "0000000000000000",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
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
      /^01_Income_Documents\/1099_NEC_ClientA_20251231\.jpg$/,
    );
  });

  it("includes tax year from aiRaw", () => {
    const row = buildExportIncomeRow(
      incomeReceipt({ aiRaw: { document_kind: "1099-NEC", tax_year: 2024 } }),
      "UTC",
    );
    assert.equal(row!.taxYear, 2024);
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
