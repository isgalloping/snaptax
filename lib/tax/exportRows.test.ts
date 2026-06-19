import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SnaptaxReceipt } from "@prisma/client";
import { buildExportExpenseRow, filterReceiptsByTaxYear } from "@/lib/tax/exportRows";

function baseReceipt(
  overrides: Partial<SnaptaxReceipt> = {},
): SnaptaxReceipt {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    userId: "user",
    ghostId: null,
    imageUrl: "receipts/test.jpg",
    status: "done",
    amount: 100 as unknown as SnaptaxReceipt["amount"],
    currency: "USD",
    merchantName: "Shell",
    category: "MEALS",
    deductible: true,
    taxAmount: 12.5 as unknown as SnaptaxReceipt["taxAmount"],
    dataRegion: "us",
    aiRaw: { deduction_ratio: 1 },
    capturedAt: new Date("2025-03-01T12:00:00.000Z"),
    snapAt: new Date("2025-03-01T12:00:00.000Z"),
    processedAt: null,
    taxSeason: null,
    taxSeasonDate: null,
    contentSha256: "abc123",
    imageFingerprint: "0000000000000000",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("buildExportExpenseRow", () => {
  it("applies 50% meals deduction on deductible amount", () => {
    const row = buildExportExpenseRow(baseReceipt(), "UTC", "us");
    assert.equal(row.deductibleAmount, 50);
    assert.equal(row.irsLine, "Line 24b");
    assert.match(row.irsSchedule, /Meals/);
    assert.equal(row.dateIso, "2025-03-01");
  });

  it("marks unclassified categories for CPA review", () => {
    const row = buildExportExpenseRow(
      baseReceipt({ category: null }),
      "UTC",
      "us",
    );
    assert.equal(row.category, "OTHER");
    assert.match(row.notes, /Unclassified/);
  });
});

describe("filterReceiptsByTaxYear", () => {
  it("includes 1099 by form tax year even when snapped later", () => {
    const receipts = [
      baseReceipt({
        id: "00000000-0000-0000-0000-000000000002",
        category: "1099-NEC",
        amount: 50000 as unknown as SnaptaxReceipt["amount"],
        taxAmount: 0 as unknown as SnaptaxReceipt["taxAmount"],
        deductible: false,
        capturedAt: new Date("2025-02-01T12:00:00.000Z"),
        snapAt: new Date("2025-02-01T12:00:00.000Z"),
        aiRaw: { document_kind: "1099-NEC", tax_year: 2024 },
      }),
    ];
    assert.equal(filterReceiptsByTaxYear(receipts, 2024, "UTC").length, 1);
    assert.equal(filterReceiptsByTaxYear(receipts, 2025, "UTC").length, 0);
  });
});
