import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import { buildLocalTaxPack } from "@/lib/export/buildLocalTaxPack";

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

describe("buildLocalTaxPack", () => {
  it("builds csv from local receipts", () => {
    const result = buildLocalTaxPack([sampleReceipt()], 2026, "UTC", "csv");
    assert.match(result.content, /Home Depot,Supplies,125\.50/);
    assert.equal(result.receiptIds.length, 1);
    assert.equal(result.mimeType, "text/csv;charset=utf-8");
  });

  it("builds txf from local receipts", () => {
    const result = buildLocalTaxPack([sampleReceipt()], 2026, "UTC", "txf");
    assert.match(result.content, /^V042/);
    assert.match(result.content, /Home Depot/);
    assert.equal(result.receiptIds.length, 1);
    assert.equal(result.mimeType, "text/plain;charset=utf-8");
  });

  it("builds qif from local receipts", () => {
    const result = buildLocalTaxPack([sampleReceipt()], 2026, "UTC", "qif");
    assert.match(result.content, /^!Type:Cash/);
    assert.match(result.content, /PHome Depot/);
    assert.equal(result.receiptIds.length, 1);
    assert.equal(result.mimeType, "application/qif;charset=utf-8");
  });

  it("builds qbo from local receipts", () => {
    const result = buildLocalTaxPack([sampleReceipt()], 2026, "UTC", "qbo");
    assert.match(result.content, /^OFXHEADER:100/);
    assert.match(result.content, /<INTU\.BID>3000<\/INTU\.BID>/);
    assert.match(result.content, /<NAME>Home Depot<\/NAME>/);
    assert.equal(result.receiptIds.length, 1);
    assert.equal(result.mimeType, "application/x-ofx;charset=utf-8");
  });

  it("throws when no expense receipts in tax year", () => {
    assert.throws(
      () => buildLocalTaxPack([sampleReceipt()], 2025, "UTC", "csv"),
      /NO_RECEIPTS/,
    );
  });

  it("throws NO_RECEIPTS for txf/qif/qbo when only non-deductible rows", () => {
    const personal = sampleReceipt({
      category: "PERSONAL",
      deductible: false,
      taxAmount: 0,
    });
    for (const format of ["txf", "qif", "qbo"] as const) {
      assert.throws(
        () => buildLocalTaxPack([personal], 2026, "UTC", format),
        /NO_RECEIPTS/,
      );
    }
  });
});
