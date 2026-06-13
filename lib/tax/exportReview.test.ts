import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import {
  receiptNeedsExportReview,
  receiptsNeedingExportReview,
} from "@/lib/tax/exportReview";

function receipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: "1",
    status: "done",
    timestamp: new Date("2025-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("exportReview", () => {
  it("flags unclassified and OTHER categories", () => {
    assert.equal(receiptNeedsExportReview(receipt({ category: undefined })), true);
    assert.equal(receiptNeedsExportReview(receipt({ category: "OTHER" })), true);
    assert.equal(receiptNeedsExportReview(receipt({ category: "TOOLS" })), false);
  });

  it("filters review list", () => {
    const list = receiptsNeedingExportReview([
      receipt({ id: "a", category: "OTHER" }),
      receipt({ id: "b", category: "MEALS" }),
    ]);
    assert.equal(list.length, 1);
    assert.equal(list[0]?.id, "a");
  });
});
