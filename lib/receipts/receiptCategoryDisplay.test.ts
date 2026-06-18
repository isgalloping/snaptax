import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import {
  receiptCategoryDisplayLabel,
  receiptTaxDisplay,
} from "./receiptCategoryDisplay.ts";

function receipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: "r1",
    status: "done",
    timestamp: new Date("2026-01-15T12:00:00Z"),
    ...overrides,
  };
}

describe("receiptCategoryDisplayLabel", () => {
  it("maps TOOLS to Tools", () => {
    assert.equal(receiptCategoryDisplayLabel("TOOLS"), "Tools");
  });

  it("maps PERSONAL to Personal", () => {
    assert.equal(receiptCategoryDisplayLabel("PERSONAL"), "Personal");
  });

  it("defaults missing category to Other", () => {
    assert.equal(receiptCategoryDisplayLabel(undefined), "Other");
  });
});

describe("receiptTaxDisplay", () => {
  it("shows green deductible amount", () => {
    const display = receiptTaxDisplay(
      receipt({ taxAmount: 12.5, deductible: true }),
    );
    assert.equal(display.variant, "deductible");
    assert.equal(display.label, "-$12.50");
  });

  it("shows muted zero for non-deductible", () => {
    const display = receiptTaxDisplay(
      receipt({ taxAmount: 0, deductible: false }),
    );
    assert.equal(display.variant, "muted");
    assert.equal(display.label, "$0.00");
  });
});
