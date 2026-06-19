import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SnaptaxReceipt } from "@prisma/client";
import { serializeReceipt } from "@/lib/receipts/serialize";

function receipt(overrides: Partial<SnaptaxReceipt> = {}): SnaptaxReceipt {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    userId: "user",
    ghostId: null,
    imageUrl: "receipts/test.jpg",
    status: "done",
    amount: 100 as unknown as SnaptaxReceipt["amount"],
    currency: "USD",
    merchantName: "Shell",
    category: "TOOLS",
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

describe("serializeReceipt", () => {
  it("does not expose aiRaw on expense receipts", () => {
    const body = serializeReceipt(receipt()) as Record<string, unknown>;
    assert.equal("aiRaw" in body, false);
    assert.equal(body.incomeTaxYear, null);
  });

  it("exposes incomeTaxYear for 1099 without full aiRaw", () => {
    const body = serializeReceipt(
      receipt({
        category: "1099-NEC",
        merchantName: "Acme Corp",
        taxAmount: 0 as unknown as SnaptaxReceipt["taxAmount"],
        deductible: false,
        aiRaw: { document_kind: "1099-NEC", payer: "Acme Corp", tax_year: 2024 },
      }),
    );
    assert.equal(body.incomeTaxYear, 2024);
    assert.equal("aiRaw" in body, false);
  });
});
