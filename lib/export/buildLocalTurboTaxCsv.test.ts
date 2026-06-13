import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import { buildLocalTurboTaxCsv } from "@/lib/export/buildLocalTurboTaxCsv";

function sampleReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    status: "done",
    amount: 120,
    merchant: "Home Depot",
    category: "SUPPLIES",
    taxAmount: 30,
    deductible: true,
    timestamp: new Date("2025-07-14T12:00:00.000Z"),
    ...overrides,
  };
}

describe("buildLocalTurboTaxCsv", () => {
  it("builds TurboTax rows for the selected tax year", () => {
    const csv = buildLocalTurboTaxCsv([sampleReceipt()], 2025, "UTC");
    assert.match(csv, /2025-07-14,Home Depot,120\.00,Line 22: Supplies,120\.00,/);
    assert.match(csv, /Receipt_Image_URL/);
  });

  it("skips receipts outside the tax year", () => {
    const csv = buildLocalTurboTaxCsv([sampleReceipt()], 2024, "UTC");
    const lines = csv.trim().split("\n");
    assert.equal(lines.length, 1);
  });
});
