import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { buildFounderTierConfigs } from "./founderConfig.ts";
import { getPaddlePriceIdForFounderTier } from "./env.ts";

describe("buildFounderTierConfigs", () => {
  const priceCents = {
    FOUNDER_LEVEL_SUPER: 100,
    EARLY: 500,
    FOUNDER: 2900,
    DEFAULT: 4900,
  };

  it("maps seat ranges per founder tier", () => {
    const tiers = buildFounderTierConfigs(priceCents);

    assert.deepEqual(tiers.FOUNDER_LEVEL_SUPER.seatRange, [1, 10]);
    assert.deepEqual(tiers.EARLY.seatRange, [11, 30]);
    assert.deepEqual(tiers.FOUNDER.seatRange, [31, 50]);
    assert.equal(tiers.DEFAULT.seatRange, null);
  });

  it("passes through flag price cents", () => {
    const tiers = buildFounderTierConfigs(priceCents);

    assert.equal(tiers.FOUNDER_LEVEL_SUPER.priceCents, 100);
    assert.equal(tiers.EARLY.priceCents, 500);
    assert.equal(tiers.FOUNDER.priceCents, 2900);
    assert.equal(tiers.DEFAULT.priceCents, 4900);
  });
});

describe("getPaddlePriceIdForFounderTier", () => {
  const prev = {
    super: process.env.PADDLE_PRICE_ID_FOUNDER_SUPER,
    early: process.env.PADDLE_PRICE_ID_FOUNDER_EARLY,
    founder: process.env.PADDLE_PRICE_ID_FOUNDER,
    default: process.env.PADDLE_PRICE_ID,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(prev)) {
      const envKey =
        key === "super"
          ? "PADDLE_PRICE_ID_FOUNDER_SUPER"
          : key === "early"
            ? "PADDLE_PRICE_ID_FOUNDER_EARLY"
            : key === "founder"
              ? "PADDLE_PRICE_ID_FOUNDER"
              : "PADDLE_PRICE_ID";
      if (value === undefined) delete process.env[envKey];
      else process.env[envKey] = value;
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

  it("wires paddle price IDs into tier config", () => {
    process.env.PADDLE_PRICE_ID_FOUNDER_SUPER = "pri_super";
    process.env.PADDLE_PRICE_ID_FOUNDER_EARLY = "pri_early";
    process.env.PADDLE_PRICE_ID_FOUNDER = "pri_founder";
    process.env.PADDLE_PRICE_ID = "pri_default";

    const tiers = buildFounderTierConfigs({
      FOUNDER_LEVEL_SUPER: 100,
      EARLY: 500,
      FOUNDER: 2900,
      DEFAULT: 4900,
    });

    assert.equal(tiers.FOUNDER_LEVEL_SUPER.paddlePriceId, "pri_super");
    assert.equal(tiers.EARLY.paddlePriceId, "pri_early");
    assert.equal(tiers.FOUNDER.paddlePriceId, "pri_founder");
    assert.equal(tiers.DEFAULT.paddlePriceId, "pri_default");
  });
});
