import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { buildFounderTierConfigs } from "@/lib/server/founderConfig";
import { resolveCheckoutSkuTier } from "./resolveCheckoutSkuTier";

const mockTiers = buildFounderTierConfigs({
  FOUNDER_LEVEL_SUPER: 5,
  EARLY: 10,
  FOUNDER: 15,
  DEFAULT: 29,
});

describe("resolveCheckoutSkuTier", () => {
  const origSpecial = process.env.SPECIAL_LEVEL_USER;

  afterEach(() => {
    if (origSpecial === undefined) delete process.env.SPECIAL_LEVEL_USER;
    else process.env.SPECIAL_LEVEL_USER = origSpecial;
  });

  it("forces SPECIAL for whitelisted user even when founder program full", () => {
    process.env.SPECIAL_LEVEL_USER = "pri_special";
    const result = resolveCheckoutSkuTier({
      actor: { kind: "user", userId: "u1", email: "test@example.com" },
      specialUsers: "test@example.com",
      specialPriceUsd: 1,
      body: { founderPurchase: true, taxSeason: "2025" },
      founderUser: null,
      claimedCount: 50,
      programOpen: false,
      enabled: true,
      tiers: mockTiers,
    });
    assert.deepEqual(result, { skuTier: "SPECIAL", isSpecial: true });
  });

  it("throws FOUNDER_PROGRAM_FULL for non-eligible user when program full", () => {
    process.env.SPECIAL_LEVEL_USER = "pri_special";
    assert.throws(
      () =>
        resolveCheckoutSkuTier({
          actor: { kind: "user", userId: "u1", email: "other@example.com" },
          specialUsers: "test@example.com",
          specialPriceUsd: 1,
          body: { founderPurchase: true, taxSeason: "2025" },
          founderUser: null,
          claimedCount: 50,
          programOpen: false,
          enabled: true,
          tiers: mockTiers,
        }),
      /FOUNDER_PROGRAM_FULL/,
    );
  });

  it("rejects client SPECIAL skuTier for non-whitelisted user", () => {
    process.env.SPECIAL_LEVEL_USER = "pri_special";
    const result = resolveCheckoutSkuTier({
      actor: { kind: "user", userId: "u1", email: "other@example.com" },
      specialUsers: "test@example.com",
      specialPriceUsd: 1,
      body: { skuTier: "SPECIAL", taxSeason: "2026" },
      founderUser: null,
      claimedCount: 0,
      programOpen: true,
      enabled: true,
      tiers: mockTiers,
    });
    assert.deepEqual(result, { skuTier: "FOUNDER_LEVEL_SUPER", isSpecial: false });
  });

  it("ignores client skuTier and uses server season offer when not founder purchase", () => {
    process.env.SPECIAL_LEVEL_USER = "pri_special";
    const result = resolveCheckoutSkuTier({
      actor: { kind: "user", userId: "u1", email: "other@example.com" },
      specialUsers: "test@example.com",
      specialPriceUsd: 1,
      body: { skuTier: "FOUNDER_LEVEL_SUPER", taxSeason: "2025" },
      founderUser: null,
      claimedCount: 50,
      programOpen: false,
      enabled: false,
      tiers: mockTiers,
    });
    assert.deepEqual(result, { skuTier: "DEFAULT", isSpecial: false });
  });

  it("falls through to season offer when no founderPurchase or skuTier", () => {
    process.env.SPECIAL_LEVEL_USER = "pri_special";
    const result = resolveCheckoutSkuTier({
      actor: { kind: "user", userId: "u1", email: "other@example.com" },
      specialUsers: "test@example.com",
      specialPriceUsd: 1,
      body: { taxSeason: "2026" },
      founderUser: null,
      claimedCount: 0,
      programOpen: true,
      enabled: true,
      tiers: mockTiers,
    });
    assert.deepEqual(result, { skuTier: "FOUNDER_LEVEL_SUPER", isSpecial: false });
  });
});
