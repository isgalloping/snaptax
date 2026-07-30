import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSpecialWebhookMinAmountCents } from "./resolveSpecialWebhookMin";

describe("resolveSpecialWebhookMinAmountCents", () => {
  it("uses default min when intentId missing", async () => {
    const result = await resolveSpecialWebhookMinAmountCents(undefined);
    assert.deepEqual(result, { kind: "default" });
  });

  it("uses public tier price when intent skuTier is not SPECIAL", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "DEFAULT",
      getPublicTierPriceCents: async () => 2900,
    });
    assert.deepEqual(result, {
      kind: "tier",
      skuTier: "DEFAULT",
      minAmountCents: 2900,
    });
  });

  it("uses the intent tier rather than forged custom_data", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "FOUNDER",
      getPublicTierPriceCents: async () => 1500,
      getSpecialPriceUsd: async () => 1,
    });
    assert.deepEqual(result, {
      kind: "tier",
      skuTier: "FOUNDER",
      minAmountCents: 1500,
    });
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
