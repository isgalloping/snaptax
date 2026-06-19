import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import { buildLocalTurboTaxCsv } from "@/lib/export/buildLocalTurboTaxCsv";

function sampleReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    status: "done",
    amount: 125.5,
    merchant: "Home Depot",
    category: "SUPPLIES",
    taxAmount: 30,
    deductible: true,
    timestamp: new Date("2026-03-15T12:00:00.000Z"),
    ...overrides,
  };
}

describe("buildLocalTurboTaxCsv", () => {
  it("builds TurboTax rows for the selected tax year", () => {
    const csv = buildLocalTurboTaxCsv([sampleReceipt()], 2026, "UTC");
    assert.match(
      csv,
      /2026-03-15,Home Depot,Supplies,125\.50,Line 22,Yes,100%,REC_20260315_HomeDepot_125\.50\.jpg/,
    );
    assert.match(csv, /Receipt_Image_URL/);
    assert.ok(!csv.startsWith("\uFEFF"));
  });

  it("skips receipts outside the tax year", () => {
    const csv = buildLocalTurboTaxCsv([sampleReceipt()], 2025, "UTC");
    const lines = csv.trim().split("\r\n");
    assert.equal(lines.length, 1);
  });
});
