import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parsePaddleTotalCents,
  validatePaddleTransaction,
} from "./validatePaddleTransaction";

describe("parsePaddleTotalCents", () => {
  it("parses Paddle totals in cents", () => {
    assert.equal(parsePaddleTotalCents({ total: "4900" }), 4900);
  });

  it("returns null for invalid totals", () => {
    assert.equal(parsePaddleTotalCents({ total: "abc" }), null);
    assert.equal(parsePaddleTotalCents(undefined), null);
  });
});

describe("validatePaddleTransaction", () => {
  const basePayload = {
    event_type: "transaction.completed",
    data: {
      id: "txn_123",
      status: "completed",
      custom_data: { intentId: "intent-uuid" },
      details: {
        totals: { total: "4900", currency_code: "USD" },
      },
    },
  };

  it("accepts valid completed transaction", () => {
    const result = validatePaddleTransaction(basePayload);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.transactionId, "txn_123");
      assert.equal(result.totalCents, 4900);
      assert.equal(result.amountUsd, 49);
      assert.equal(result.customData?.intentId, "intent-uuid");
    }
  });

  it("passes through founder custom_data fields", () => {
    const result = validatePaddleTransaction({
      ...basePayload,
      data: {
        ...basePayload.data!,
        custom_data: {
          intentId: "intent-uuid",
          founderPurchase: true,
          skuTier: "FOUNDER_LEVEL_SUPER",
        },
      },
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.customData?.founderPurchase, true);
      assert.equal(result.customData?.skuTier, "FOUNDER_LEVEL_SUPER");
    }
  });

  it("rejects non-completed status", () => {
    const result = validatePaddleTransaction({
      ...basePayload,
      data: { ...basePayload.data!, status: "draft" },
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_status");
  });

  it("accepts founder super tier amount ($5)", () => {
    const result = validatePaddleTransaction({
      ...basePayload,
      data: {
        ...basePayload.data!,
        details: { totals: { total: "500", currency_code: "USD" } },
        custom_data: { intentId: "intent-uuid", founderPurchase: true, skuTier: "FOUNDER_LEVEL_SUPER" },
      },
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.totalCents, 500);
      assert.equal(result.amountUsd, 5);
    }
  });

  it("rejects amount below minimum", () => {
    const result = validatePaddleTransaction({
      ...basePayload,
      data: {
        ...basePayload.data!,
        details: { totals: { total: "0", currency_code: "USD" } },
      },
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "amount_too_low");
  });

  it("rejects wrong currency", () => {
    const result = validatePaddleTransaction({
      ...basePayload,
      data: {
        ...basePayload.data!,
        details: { totals: { total: "4900", currency_code: "EUR" } },
      },
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_currency");
  });
});
