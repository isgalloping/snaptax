import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exportFiledReceiptIdsForTaxYear } from "./exportFiledReceiptIdsForTaxYear.ts";
import type { Receipt } from "@/lib/types";

describe("exportFiledReceiptIdsForTaxYear", () => {
  it("includes every done receipt in the tax year", () => {
    const receipts: Receipt[] = [
      {
        id: "business",
        status: "done",
        category: "SUPPLIES",
        timestamp: new Date("2026-03-01T12:00:00.000Z"),
      },
      {
        id: "personal",
        status: "done",
        category: "PERSONAL",
        timestamp: new Date("2026-03-02T12:00:00.000Z"),
      },
      {
        id: "other-year",
        status: "done",
        category: "SUPPLIES",
        timestamp: new Date("2025-03-01T12:00:00.000Z"),
      },
    ];

    assert.deepEqual(
      exportFiledReceiptIdsForTaxYear(receipts, 2026, "UTC"),
      ["business", "personal"],
    );
  });
});
