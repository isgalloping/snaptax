import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { buildSpecialSeasonOffer } from "@/lib/billing/specialCheckout";
import { buildFounderTierConfigs } from "./founderConfig";
import {
  resolveSeasonOfferForActor,
  resolveSeasonOfferFromState,
} from "./seasonOffer";

const tiers = buildFounderTierConfigs({
  FOUNDER_LEVEL_SUPER: 5,
  EARLY: 10,
  FOUNDER: 15,
  DEFAULT: 29,
});

describe("resolveSeasonOfferFromState", () => {
  it("uses DEFAULT when founder program flag is off", () => {
    const offer = resolveSeasonOfferFromState({
      enabled: false,
      tiers,
      user: null,
      claimedCount: 0,
      programOpen: false,
      taxSeason: "2026",
    });
    assert.equal(offer.priceUsd, 29);
    assert.equal(offer.skuTier, "DEFAULT");
  });

  it("uses super founder price for first open seat", () => {
    const offer = resolveSeasonOfferFromState({
      enabled: true,
      tiers,
      user: null,
      claimedCount: 0,
      programOpen: true,
      taxSeason: "2026",
    });
    assert.equal(offer.priceUsd, 5);
    assert.equal(offer.skuTier, "FOUNDER_LEVEL_SUPER");
  });

  it("uses DEFAULT after 50 seats are claimed", () => {
    const offer = resolveSeasonOfferFromState({
      enabled: true,
      tiers,
      user: {
        founderStatus: "none",
        founderTier: null,
        founderNumber: null,
      },
      claimedCount: 50,
      programOpen: false,
      taxSeason: "2026",
    });
    assert.equal(offer.priceUsd, 29);
    assert.equal(offer.skuTier, "DEFAULT");
  });

  it("uses locked tier for active founder renewal", () => {
    const offer = resolveSeasonOfferFromState({
      enabled: true,
      tiers,
      user: {
        founderStatus: "active",
        founderTier: "EARLY",
        founderNumber: 12,
      },
      claimedCount: 20,
      programOpen: true,
      taxSeason: "2026",
    });
    assert.equal(offer.priceUsd, 10);
    assert.equal(offer.skuTier, "EARLY");
  });
});

describe("buildSpecialSeasonOffer", () => {
  it("resolveSpecialSeasonOffer returns internal test offer", () => {
    const offer = buildSpecialSeasonOffer("2025", 1);
    assert.equal(offer.skuTier, "SPECIAL");
    assert.equal(offer.priceLabel, "$1.00");
  });
});

describe("resolveSeasonOfferForActor", () => {
  const origSpecial = process.env.SPECIAL_LEVEL_USER;

  afterEach(() => {
    if (origSpecial === undefined) delete process.env.SPECIAL_LEVEL_USER;
    else process.env.SPECIAL_LEVEL_USER = origSpecial;
  });

  it("returns SPECIAL when actor is eligible", () => {
    const actor = { kind: "user" as const, userId: "u1", email: "test@example.com" };
    process.env.SPECIAL_LEVEL_USER = "pri_special";
    const offer = resolveSeasonOfferForActor({
      actor,
      specialUsers: "test@example.com",
      specialPriceUsd: 1,
      enabled: true,
      tiers,
      user: null,
      claimedCount: 0,
      programOpen: true,
      taxSeason: "2025",
    });
    assert.equal(offer.skuTier, "SPECIAL");
    assert.equal(offer.priceDisplay, "internal_test");
  });

  it("falls through to founder pricing when actor is not eligible", () => {
    const actor = { kind: "user" as const, userId: "u1", email: "other@example.com" };
    process.env.SPECIAL_LEVEL_USER = "pri_special";
    const offer = resolveSeasonOfferForActor({
      actor,
      specialUsers: "test@example.com",
      specialPriceUsd: 1,
      enabled: true,
      tiers,
      user: null,
      claimedCount: 0,
      programOpen: true,
      taxSeason: "2026",
    });
    assert.equal(offer.skuTier, "FOUNDER_LEVEL_SUPER");
    assert.equal(offer.priceUsd, 5);
  });

  it("falls through when actor is null", () => {
    process.env.SPECIAL_LEVEL_USER = "pri_special";
    const offer = resolveSeasonOfferForActor({
      actor: null,
      specialUsers: "test@example.com",
      specialPriceUsd: 1,
      enabled: true,
      tiers,
      user: null,
      claimedCount: 0,
      programOpen: true,
      taxSeason: "2026",
    });
    assert.equal(offer.skuTier, "FOUNDER_LEVEL_SUPER");
  });
});
