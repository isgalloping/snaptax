import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SnaptaxReceipt } from "@prisma/client";
import { buildExportExpenseRow } from "@/lib/tax/exportRows";

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
