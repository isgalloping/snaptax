import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { buildFounderTierConfigs } from "./founderConfig.ts";
import { getPaddlePriceIdForFounderTier } from "./env.ts";

describe("buildFounderTierConfigs", () => {
  const priceUsd = {
    FOUNDER_LEVEL_SUPER: 5,
    EARLY: 10,
    FOUNDER: 15,
    DEFAULT: 29,
  };

  it("maps seat ranges per founder tier", () => {
    const tiers = buildFounderTierConfigs(priceUsd);

    assert.deepEqual(tiers.FOUNDER_LEVEL_SUPER.seatRange, [1, 10]);
    assert.deepEqual(tiers.EARLY.seatRange, [11, 30]);
    assert.deepEqual(tiers.FOUNDER.seatRange, [31, 50]);
    assert.equal(tiers.DEFAULT.seatRange, null);
  });

  it("stores USD and derives cents for Paddle", () => {
    const tiers = buildFounderTierConfigs(priceUsd);

    assert.equal(tiers.FOUNDER_LEVEL_SUPER.priceUsd, 5);
    assert.equal(tiers.EARLY.priceUsd, 10);
    assert.equal(tiers.FOUNDER.priceUsd, 15);
    assert.equal(tiers.DEFAULT.priceUsd, 29);
    assert.equal(tiers.FOUNDER_LEVEL_SUPER.priceCents, 500);
    assert.equal(tiers.DEFAULT.priceCents, 2900);
  });
});

describe("getPaddlePriceIdForFounderTier", () => {
  const envKeys = [
    "PADDLE_PRICE_ID_FOUNDER_SUPER",
    "PADDLE_PRICE_ID_FOUNDER_EARLY",
    "PADDLE_PRICE_ID_FOUNDER",
    "PADDLE_PRICE_ID",
    "FOUNDER_LEVEL_SUPER",
    "FOUNDER_LEVEL_EARLY",
    "FOUNDER_LEVEL_FOUNDER",
    "FOUNDER_LEVEL_DEFAULT",
  ] as const;

  const prev = Object.fromEntries(envKeys.map((k) => [k, process.env[k]]));

  afterEach(() => {
    for (const key of envKeys) {
      const value = prev[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("resolves tier-specific Paddle price IDs from env", () => {
    process.env.PADDLE_PRICE_ID_FOUNDER_SUPER = "pri_super";
    process.env.PADDLE_PRICE_ID_FOUNDER_EARLY = "pri_early";
    process.env.PADDLE_PRICE_ID_FOUNDER = "pri_founder";
    process.env.PADDLE_PRICE_ID = "pri_default";

    assert.equal(getPaddlePriceIdForFounderTier("FOUNDER_LEVEL_SUPER"), "pri_super");
    assert.equal(getPaddlePriceIdForFounderTier("EARLY"), "pri_early");
    assert.equal(getPaddlePriceIdForFounderTier("FOUNDER"), "pri_founder");
    assert.equal(getPaddlePriceIdForFounderTier("DEFAULT"), "pri_default");
    assert.equal(getPaddlePriceIdForFounderTier("unknown"), "pri_default");
  });

  it("falls back to FOUNDER_LEVEL_* env names from Vercel", () => {
    delete process.env.PADDLE_PRICE_ID_FOUNDER_SUPER;
    delete process.env.PADDLE_PRICE_ID_FOUNDER_EARLY;
    delete process.env.PADDLE_PRICE_ID_FOUNDER;
    delete process.env.PADDLE_PRICE_ID;
    process.env.FOUNDER_LEVEL_SUPER = "pri_vercel_super";
    process.env.FOUNDER_LEVEL_EARLY = "pri_vercel_early";
    process.env.FOUNDER_LEVEL_FOUNDER = "pri_vercel_founder";
    process.env.FOUNDER_LEVEL_DEFAULT = "pri_vercel_default";

    assert.equal(getPaddlePriceIdForFounderTier("FOUNDER_LEVEL_SUPER"), "pri_vercel_super");
    assert.equal(getPaddlePriceIdForFounderTier("EARLY"), "pri_vercel_early");
    assert.equal(getPaddlePriceIdForFounderTier("FOUNDER"), "pri_vercel_founder");
    assert.equal(getPaddlePriceIdForFounderTier("DEFAULT"), "pri_vercel_default");
  });

  it("wires paddle price IDs into tier config", () => {
    process.env.PADDLE_PRICE_ID_FOUNDER_SUPER = "pri_super";
    process.env.PADDLE_PRICE_ID_FOUNDER_EARLY = "pri_early";
    process.env.PADDLE_PRICE_ID_FOUNDER = "pri_founder";
    process.env.PADDLE_PRICE_ID = "pri_default";

    const tiers = buildFounderTierConfigs({
      FOUNDER_LEVEL_SUPER: 5,
      EARLY: 10,
      FOUNDER: 15,
      DEFAULT: 29,
    });

    assert.equal(tiers.FOUNDER_LEVEL_SUPER.paddlePriceId, "pri_super");
    assert.equal(tiers.EARLY.paddlePriceId, "pri_early");
    assert.equal(tiers.FOUNDER.paddlePriceId, "pri_founder");
    assert.equal(tiers.DEFAULT.paddlePriceId, "pri_default");
  });
});
