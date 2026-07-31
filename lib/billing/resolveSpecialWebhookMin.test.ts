import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSpecialWebhookMinAmountCents } from "./resolveSpecialWebhookMin";

const tierPrices = {
  FOUNDER_LEVEL_SUPER: 500,
  EARLY: 1000,
  FOUNDER: 1500,
  DEFAULT: 2900,
};

describe("resolveSpecialWebhookMinAmountCents", () => {
  it("uses default min when intentId missing", async () => {
    const result = await resolveSpecialWebhookMinAmountCents(undefined);
    assert.deepEqual(result, { kind: "default" });
  });

  it("returns configured tier min when intent skuTier is DEFAULT", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "DEFAULT",
      getFounderTierPriceCents: async (tier) => tierPrices[tier],
    });
    assert.deepEqual(result, {
      kind: "tier",
      skuTier: "DEFAULT",
      minAmountCents: 2900,
    });
  });

  it("ignores forged custom_data; only intent skuTier controls min", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "FOUNDER",
      getFounderTierPriceCents: async (tier) => tierPrices[tier],
      getSpecialPriceUsd: async () => 1,
    });
    assert.deepEqual(result, {
      kind: "tier",
      skuTier: "FOUNDER",
      minAmountCents: 1500,
    });
  });

  it("errors when intent tier price is unset", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "DEFAULT",
      getFounderTierPriceCents: async () => 0,
    });
    assert.deepEqual(result, {
      kind: "error",
      reason: "tier_price_unconfigured",
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
