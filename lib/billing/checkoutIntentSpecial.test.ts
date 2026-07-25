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
  const origSpecial = process.env.FOUNDER_LEVEL_SPECIAL;

  afterEach(() => {
    if (origSpecial === undefined) delete process.env.FOUNDER_LEVEL_SPECIAL;
    else process.env.FOUNDER_LEVEL_SPECIAL = origSpecial;
  });

  it("forces SPECIAL for whitelisted user even when founder program full", () => {
    process.env.FOUNDER_LEVEL_SPECIAL = "pri_special";
    const result = resolveCheckoutSkuTier({
      actor: { kind: "user", userId: "u1", email: "test@example.com" },
      verfyUser: "test@example.com",
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
    process.env.FOUNDER_LEVEL_SPECIAL = "pri_special";
    assert.throws(
      () =>
        resolveCheckoutSkuTier({
          actor: { kind: "user", userId: "u1", email: "other@example.com" },
          verfyUser: "test@example.com",
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

  it("uses explicit body skuTier when not founder purchase", () => {
    process.env.FOUNDER_LEVEL_SPECIAL = "pri_special";
    const result = resolveCheckoutSkuTier({
      actor: { kind: "user", userId: "u1", email: "other@example.com" },
      verfyUser: "test@example.com",
      body: { skuTier: "DEFAULT", taxSeason: "2025" },
      founderUser: null,
      claimedCount: 0,
      programOpen: true,
      enabled: true,
      tiers: mockTiers,
    });
    assert.deepEqual(result, { skuTier: "DEFAULT", isSpecial: false });
  });

  it("falls through to season offer when no founderPurchase or skuTier", () => {
    process.env.FOUNDER_LEVEL_SPECIAL = "pri_special";
    const result = resolveCheckoutSkuTier({
      actor: { kind: "user", userId: "u1", email: "other@example.com" },
      verfyUser: "test@example.com",
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
