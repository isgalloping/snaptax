import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFounderTierConfigs } from "./founderConfig";
import { resolveSeasonOfferFromState } from "./seasonOffer";

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
