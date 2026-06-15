import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import {
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

  it("falls back to calendar default when empty", () => {
    const year = pickDefaultExportTaxYear([]);
    assert.equal(typeof year, "number");
    assert.ok(year >= 2020);
  });
});
