import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mockReceiptVision } from "./mockReceiptVision";
import { US_EXPORT_CATEGORIES } from "@/lib/tax/usExportCategories";

describe("mockReceiptVision", () => {
  it("returns done status with amount in range for US", () => {
    const result = mockReceiptVision("us");
    assert.equal(result.status, "done");
    assert.ok(result.amount != null && result.amount >= 5 && result.amount <= 200);
    assert.equal(result.taxAmount, Math.round(result.amount! * 0.25 * 100) / 100);
    assert.equal(result.aiRaw.mock, true);
    assert.notEqual(result.category, "PERSONAL");
    assert.ok(US_EXPORT_CATEGORIES.includes(result.category as never));
  });

  it("returns EUR currency for EU", () => {
    const result = mockReceiptVision("eu");
    assert.equal(result.currency, "EUR");
    assert.equal(result.status, "done");
  });
});
