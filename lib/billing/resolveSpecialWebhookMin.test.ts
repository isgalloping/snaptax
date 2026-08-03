import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSpecialWebhookMinAmountCents } from "./resolveSpecialWebhookMin";

describe("resolveSpecialWebhookMinAmountCents", () => {
  it("uses default min when intentId missing", async () => {
    const result = await resolveSpecialWebhookMinAmountCents(undefined);
    assert.deepEqual(result, { kind: "default" });
  });

  it("uses configured default price when intent skuTier is DEFAULT", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "DEFAULT",
      getTierPriceCents: async (tier) => (tier === "DEFAULT" ? 4900 : null),
    });
    assert.deepEqual(result, { kind: "tier", minAmountCents: 4900 });
  });

  it("uses configured founder price when intent skuTier is a founder tier", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "FOUNDER",
      getTierPriceCents: async (tier) => (tier === "FOUNDER" ? 1500 : null),
    });
    assert.deepEqual(result, { kind: "tier", minAmountCents: 1500 });
  });

  it("ignores forged custom_data; only intent skuTier SPECIAL gets special min", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "FOUNDER",
      getTierPriceCents: async (tier) => (tier === "FOUNDER" ? 1500 : null),
      getSpecialPriceUsd: async () => 1,
    });
    assert.deepEqual(result, { kind: "tier", minAmountCents: 1500 });
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
