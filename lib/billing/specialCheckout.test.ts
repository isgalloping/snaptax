import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import type { Actor } from "@/lib/auth/getActor";
import {
  normalizeWhitelistEmail,
  resolveSpecialCheckoutEligible,
  buildSpecialSeasonOffer,
  SPECIAL_PRICE_LABEL,
} from "./specialCheckout";

const user: Actor = { kind: "user", userId: "u1", email: "Test@Example.com" };
const ghost: Actor = { kind: "ghost", ghostId: "g1", bound: false };

describe("normalizeWhitelistEmail", () => {
  it("lowercases and trims", () => {
    assert.equal(normalizeWhitelistEmail("  Test@Example.com "), "test@example.com");
  });
});

describe("resolveSpecialCheckoutEligible", () => {
  const orig = process.env.FOUNDER_LEVEL_SPECIAL;

  afterEach(() => {
    if (orig === undefined) delete process.env.FOUNDER_LEVEL_SPECIAL;
    else process.env.FOUNDER_LEVEL_SPECIAL = orig;
  });

  it("returns true for matching user with env set", () => {
    process.env.FOUNDER_LEVEL_SPECIAL = "pri_special_test";
    assert.equal(resolveSpecialCheckoutEligible(user, "test@example.com"), true);
  });

  it("returns false for ghost", () => {
    process.env.FOUNDER_LEVEL_SPECIAL = "pri_special_test";
    assert.equal(resolveSpecialCheckoutEligible(ghost, "test@example.com"), false);
  });

  it("returns false when verfyUser empty", () => {
    process.env.FOUNDER_LEVEL_SPECIAL = "pri_special_test";
    assert.equal(resolveSpecialCheckoutEligible(user, ""), false);
  });

  it("returns false when env missing", () => {
    delete process.env.FOUNDER_LEVEL_SPECIAL;
    assert.equal(resolveSpecialCheckoutEligible(user, "test@example.com"), false);
  });

  it("returns false for non-matching email", () => {
    process.env.FOUNDER_LEVEL_SPECIAL = "pri_special_test";
    assert.equal(resolveSpecialCheckoutEligible(user, "other@example.com"), false);
  });
});

describe("buildSpecialSeasonOffer", () => {
  it("returns internal test payload", () => {
    const offer = buildSpecialSeasonOffer("2025");
    assert.equal(offer.skuTier, "SPECIAL");
    assert.equal(offer.priceUsd, 0);
    assert.equal(offer.priceCents, 0);
    assert.equal(offer.taxSeason, "2025");
    assert.equal(offer.priceDisplay, "internal_test");
    assert.equal(offer.priceLabel, SPECIAL_PRICE_LABEL);
  });
});
