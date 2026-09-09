import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import { computeEuTaxAmount, computeEuVatAmount } from "./computeEu.ts";
import { computeTaxAmount } from "./computeTaxAmount.ts";
import { computeUsTaxAmount, usDeductibleBase } from "./computeUs.ts";
import { resolveDeductionRatio } from "./usCategories.ts";
import type { EuAiFields, UsAiFields } from "./types.ts";

const originalMarginalRate = process.env.TAX_US_MARGINAL_RATE;

beforeEach(() => {
  process.env.TAX_US_MARGINAL_RATE = "0.25";
});

after(() => {
  if (originalMarginalRate == null) {
    delete process.env.TAX_US_MARGINAL_RATE;
    return;
  }
  process.env.TAX_US_MARGINAL_RATE = originalMarginalRate;
});

function usFields(overrides: Partial<UsAiFields> = {}): UsAiFields {
  return {
    amount: 100,
    merchant: "Depot",
    category: "TOOLS",
    deductible: true,
    deduction_ratio: 1,
    confidence: 0.9,
    ...overrides,
  };
}

function euFields(overrides: Partial<EuAiFields> = {}): EuAiFields {
  return {
    amount: 119,
    currency: "EUR",
    merchant: "Supply Shop",
    category: "SUPPLIES",
    deductible: true,
    vat_rate: 0.19,
    vat_amount: null,
    confidence: 0.9,
    ...overrides,
  };
}

describe("resolveDeductionRatio", () => {
  it("uses the conservative category cap when AI overstates meals", () => {
    assert.equal(resolveDeductionRatio(" meals ", 1), 0.5);
  });

  it("forces personal purchases to zero even when AI marks them deductible", () => {
    assert.equal(resolveDeductionRatio("PERSONAL", 1), 0);
  });

  it("clamps unknown category AI ratios into the allowed range", () => {
    assert.equal(resolveDeductionRatio("CUSTOM", 1.4), 1);
    assert.equal(resolveDeductionRatio("CUSTOM", -0.2), 0);
  });
});

describe("computeUsTaxAmount", () => {
  it("taxes only the deductible half of US business meals", () => {
    const fields = usFields({ category: "MEALS", deduction_ratio: 1 });

    assert.equal(usDeductibleBase(fields), 50);
    assert.equal(computeUsTaxAmount(fields), 12.5);
  });

  it("uses the AI ratio for categories without a stricter table cap", () => {
    const fields = usFields({ category: "CLIENT PARKING", deduction_ratio: 0.8 });

    assert.equal(usDeductibleBase(fields), 80);
    assert.equal(computeUsTaxAmount(fields), 20);
  });

  it("returns zero for non-deductible and personal receipts", () => {
    assert.equal(computeUsTaxAmount(usFields({ deductible: false })), 0);
    assert.equal(
      computeUsTaxAmount(usFields({ category: "PERSONAL", deduction_ratio: 1 })),
      0,
    );
  });
});

describe("computeEuTaxAmount", () => {
  it("uses an explicit VAT amount when OpenAI extracts one", () => {
    assert.equal(computeEuVatAmount(euFields({ vat_amount: 18.72 })), 18.72);
    assert.equal(computeEuTaxAmount(euFields({ vat_amount: 18.72 })), 18.72);
  });

  it("derives VAT from gross amount and VAT rate when explicit VAT is absent", () => {
    assert.equal(computeEuVatAmount(euFields()), 19);
    assert.equal(computeEuTaxAmount(euFields()), 19);
  });

  it("returns zero when an EU receipt is non-deductible or VAT data is missing", () => {
    assert.equal(computeEuTaxAmount(euFields({ deductible: false })), 0);
    assert.equal(computeEuTaxAmount(euFields({ vat_rate: null, vat_amount: null })), 0);
  });
});

describe("computeTaxAmount", () => {
  it("dispatches by tax region", () => {
    assert.equal(computeTaxAmount("us", usFields({ category: "MEALS" })), 12.5);
    assert.equal(computeTaxAmount("eu", euFields()), 19);
  });
});
