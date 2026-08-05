import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveFiledReceiptIds } from "./resolveFiledReceiptIds.ts";

describe("resolveFiledReceiptIds", () => {
  const allDone = [
    {
      id: "expense-1",
      capturedAt: new Date("2026-03-01T12:00:00.000Z"),
      snapAt: null,
    },
    {
      id: "income-1",
      capturedAt: new Date("2026-03-02T12:00:00.000Z"),
      snapAt: null,
      category: "1099-NEC",
    },
    {
      id: "other-year",
      capturedAt: new Date("2025-03-01T12:00:00.000Z"),
      snapAt: null,
    },
  ];

  it("files all done receipts in the tax year when ids are omitted", () => {
    const result = resolveFiledReceiptIds(allDone, 2026, "UTC");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.receiptIds, ["expense-1", "income-1"]);
    }
  });

  it("files only requested ids that belong to the tax year", () => {
    const result = resolveFiledReceiptIds(allDone, 2026, "UTC", ["expense-1"]);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.receiptIds, ["expense-1"]);
    }
  });

  it("rejects ids outside the tax year", () => {
    const result = resolveFiledReceiptIds(allDone, 2026, "UTC", ["other-year"]);
    assert.deepEqual(result, { ok: false, reason: "INVALID_RECEIPT_IDS" });
  });
});
