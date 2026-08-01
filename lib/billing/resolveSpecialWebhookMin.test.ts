import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  minAmountCentsFromResolution,
  resolveSpecialWebhookMinAmountCents,
} from "./resolveSpecialWebhookMin";

describe("resolveSpecialWebhookMinAmountCents", () => {
  it("uses default min when intentId missing", async () => {
    const result = await resolveSpecialWebhookMinAmountCents(undefined);
    assert.deepEqual(result, { kind: "default" });
  });

  it("uses tier min when intent skuTier is a public tier", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "DEFAULT",
      getTierPriceCents: async () => 2900,
    });
    assert.deepEqual(result, { kind: "tier", minAmountCents: 2900 });
  });

  it("treats null legacy intent skuTier as DEFAULT", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => null,
      getTierPriceCents: async (tier) => (tier === "DEFAULT" ? 2900 : null),
    });
    assert.deepEqual(result, { kind: "tier", minAmountCents: 2900 });
  });

  it("fails closed when an intent has an unknown skuTier", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "UNKNOWN",
      getTierPriceCents: async () => 2900,
    });
    assert.deepEqual(result, {
      kind: "error",
      reason: "unknown_sku_tier",
    });
  });

  it("ignores forged custom_data; non-SPECIAL intent tiers use their own min", async () => {
    const result = await resolveSpecialWebhookMinAmountCents("intent-1", {
      findIntentSkuTier: async () => "FOUNDER",
      getTierPriceCents: async () => 1500,
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

describe("minAmountCentsFromResolution", () => {
  it("passes tier and special minimums to Paddle validation", () => {
    assert.equal(
      minAmountCentsFromResolution({ kind: "tier", minAmountCents: 2900 }),
      2900,
    );
    assert.equal(
      minAmountCentsFromResolution({ kind: "special", minAmountCents: 100 }),
      100,
    );
  });

  it("leaves legacy no-intent validation on the default minimum", () => {
    assert.equal(minAmountCentsFromResolution({ kind: "default" }), undefined);
  });
});
