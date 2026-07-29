import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSpecialWebhookMinAmountCents } from "./resolveSpecialWebhookMin";

describe("resolveSpecialWebhookMinAmountCents", () => {
  it("uses default min when intentId missing", async () => {
    const result = await resolveSpecialWebhookMinAmountCents(undefined);
    assert.deepEqual(result, { kind: "default" });
  });

  it("uses DEFAULT tier min when intent skuTier is DEFAULT", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "DEFAULT",
      getTierPriceCents: async () => 2900,
    });
    assert.deepEqual(result, { kind: "default", minAmountCents: 2900 });
  });

  it("uses founder tier min when intent skuTier is a founder discount", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "FOUNDER_LEVEL_SUPER",
      getTierPriceCents: async () => 500,
    });
    assert.deepEqual(result, { kind: "default", minAmountCents: 500 });
  });

  it("uses default min when intent skuTier is unknown", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "LEGACY_UNKNOWN",
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
