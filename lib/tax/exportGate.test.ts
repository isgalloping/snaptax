import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import {
  exportPickerTaxYears,
  hasExportableReceipts,
  pickDefaultExportTaxYear,
} from "./exportGate.ts";

function doneReceipt(year: number): Receipt {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    status: "done",
    timestamp: new Date(`${year}-06-15T12:00:00.000Z`),
  };
}

describe("hasExportableReceipts", () => {
  it("returns false when no done receipts", () => {
    assert.equal(hasExportableReceipts([]), false);
    assert.equal(
      hasExportableReceipts([
        { id: "1", status: "processing", timestamp: new Date() },
      ]),
      false,
    );
  });

  it("returns true when a done receipt exists", () => {
    assert.equal(hasExportableReceipts([doneReceipt(2025)]), true);
  });
});

describe("pickDefaultExportTaxYear", () => {
  it("returns newest year with receipts", () => {
    assert.equal(
      pickDefaultExportTaxYear([doneReceipt(2024), doneReceipt(2025)]),
      2025,
    );
  });

  it("prefers filing year for paid season when receipts exist there", () => {
    assert.equal(
      pickDefaultExportTaxYear([doneReceipt(2025), doneReceipt(2026)], "UTC", "2027"),
      2026,
    );
  });

  it("falls back to calendar default when empty", () => {
    const year = pickDefaultExportTaxYear([]);
    assert.equal(typeof year, "number");
    assert.ok(year >= 2020);
  });

  it("falls back to filing year for season when no receipts", () => {
    assert.equal(pickDefaultExportTaxYear([], "UTC", "2027"), 2026);
  });
});

describe("exportPickerTaxYears", () => {
  it("includes filing year for season even without receipts", () => {
    assert.deepEqual(exportPickerTaxYears([], "UTC", "2027"), [2026]);
  });

  it("lists filing year first then other receipt years", () => {
    assert.deepEqual(
      exportPickerTaxYears([doneReceipt(2025), doneReceipt(2026)], "UTC", "2027"),
      [2026, 2025],
    );
  });
});
