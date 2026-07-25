import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSpecialWebhookMinAmountCents } from "./resolveSpecialWebhookMin";

describe("resolveSpecialWebhookMinAmountCents", () => {
  it("uses default min when intentId missing", async () => {
    const result = await resolveSpecialWebhookMinAmountCents(undefined);
    assert.deepEqual(result, { kind: "default" });
  });

  it("uses default min when intent skuTier is not SPECIAL", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "DEFAULT",
    });
    assert.deepEqual(result, { kind: "default" });
  });

  it("ignores forged custom_data; only intent skuTier SPECIAL gets special min", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "FOUNDER",
      getSpecialPriceUsd: async () => 1,
    });
    assert.deepEqual(result, { kind: "default" });
  });

  it("returns special min from specialPrice flag when intent is SPECIAL", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "SPECIAL",
      getSpecialPriceUsd: async () => 1,
    });
    assert.deepEqual(result, { kind: "special", minAmountCents: 100 });
  });

  it("errors when intent is SPECIAL but specialPrice is unset", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "SPECIAL",
      getSpecialPriceUsd: async () => 0,
    });
    assert.deepEqual(result, {
      kind: "error",
      reason: "special_price_unconfigured",
    });
  });
});
