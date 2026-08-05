import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractPaddleTransactionPriceIds,
  validatePaddleTransactionPriceIds,
} from "./paddleTransactionPriceId.ts";

describe("extractPaddleTransactionPriceIds", () => {
  it("reads nested price.id and legacy price_id", () => {
    assert.deepEqual(
      extractPaddleTransactionPriceIds({
        data: {
          items: [
            { price: { id: "pri_nested" } },
            { price_id: "pri_legacy" },
          ],
        },
      }),
      ["pri_nested", "pri_legacy"],
    );
  });
});

describe("validatePaddleTransactionPriceIds", () => {
  it("rejects payloads without line item price ids", async () => {
    const result = await validatePaddleTransactionPriceIds({
      transactionPriceIds: [],
      intentId: "intent-1",
      resolveExpectedForIntent: async () => "pri_expected",
    });
    assert.deepEqual(result, { ok: false, reason: "missing_price_id" });
  });

  it("accepts the intent expected price id", async () => {
    const result = await validatePaddleTransactionPriceIds({
      transactionPriceIds: ["pri_other", "pri_expected"],
      intentId: "intent-1",
      resolveExpectedForIntent: async () => "pri_expected",
    });
    assert.deepEqual(result, { ok: true });
  });

  it("rejects intent checkout when expected price lookup misses", async () => {
    const result = await validatePaddleTransactionPriceIds({
      transactionPriceIds: ["pri_default"],
      intentId: "intent-1",
      resolveExpectedForIntent: async () => null,
      collectConfigured: async () => new Set(["pri_default", "pri_founder"]),
    });
    assert.deepEqual(result, { ok: false, reason: "unexpected_price_id" });
  });

  it("rejects unexpected price ids for an intent", async () => {
    const result = await validatePaddleTransactionPriceIds({
      transactionPriceIds: ["pri_wrong"],
      intentId: "intent-1",
      resolveExpectedForIntent: async () => "pri_expected",
      collectConfigured: async () => new Set(["pri_expected"]),
    });
    assert.deepEqual(result, { ok: false, reason: "unexpected_price_id" });
  });

  it("falls back to configured price ids when intent is missing", async () => {
    const result = await validatePaddleTransactionPriceIds({
      transactionPriceIds: ["pri_default"],
      collectConfigured: async () => new Set(["pri_default", "pri_founder"]),
    });
    assert.deepEqual(result, { ok: true });
  });
});
