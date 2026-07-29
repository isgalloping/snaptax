import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import type { Actor } from "@/lib/auth/getActor";
import {
  normalizeWhitelistEmail,
  parseSpecialUsers,
  isSpecialUser,
  resolveSpecialCheckoutEligible,
  buildSpecialSeasonOffer,
} from "./specialCheckout";

const user: Actor = { kind: "user", userId: "u1", email: "Test@Example.com" };
const ghost: Actor = { kind: "ghost", ghostId: "g1", bound: false };

describe("normalizeWhitelistEmail", () => {
  it("lowercases and trims", () => {
    assert.equal(normalizeWhitelistEmail("  Test@Example.com "), "test@example.com");
  });
});

describe("parseSpecialUsers", () => {
  it("splits comma list case-insensitively", () => {
    const set = parseSpecialUsers(" a@x.com , B@Y.com ");
    assert.equal(set.has("a@x.com"), true);
    assert.equal(set.has("b@y.com"), true);
    assert.equal(set.size, 2);
  });
});

describe("isSpecialUser", () => {
  it("matches whitelisted email case-insensitively", () => {
    assert.equal(isSpecialUser("B@Y.com", "a@x.com,b@y.com"), true);
    assert.equal(isSpecialUser("other@example.com", "a@x.com,b@y.com"), false);
  });

  it("returns false when whitelist empty", () => {
    assert.equal(isSpecialUser("test@example.com", ""), false);
    assert.equal(isSpecialUser("test@example.com", "   "), false);
  });
});

describe("resolveSpecialCheckoutEligible", () => {
  const orig = process.env.SPECIAL_LEVEL_USER;

  afterEach(() => {
    if (orig === undefined) delete process.env.SPECIAL_LEVEL_USER;
    else process.env.SPECIAL_LEVEL_USER = orig;
  });

  it("returns true for matching user with env set", () => {
    process.env.SPECIAL_LEVEL_USER = "pri_special_test";
    assert.equal(resolveSpecialCheckoutEligible(user, "test@example.com", 1), true);
  });

  it("returns true for second whitelisted user", () => {
    process.env.SPECIAL_LEVEL_USER = "pri_special";
    const actor: Actor = { kind: "user", userId: "u1", email: "b@y.com" };
    assert.equal(resolveSpecialCheckoutEligible(actor, "a@x.com,b@y.com", 1), true);
  });

  it("returns false for ghost", () => {
    process.env.SPECIAL_LEVEL_USER = "pri_special_test";
    assert.equal(resolveSpecialCheckoutEligible(ghost, "test@example.com", 1), false);
  });

  it("returns false when specialUsers empty", () => {
    process.env.SPECIAL_LEVEL_USER = "pri_special_test";
    assert.equal(resolveSpecialCheckoutEligible(user, "", 1), false);
  });

  it("returns false when specialPrice is 0", () => {
    process.env.SPECIAL_LEVEL_USER = "pri_special";
    assert.equal(resolveSpecialCheckoutEligible(user, "test@example.com", 0), false);
  });

  it("returns false when env missing", () => {
    delete process.env.SPECIAL_LEVEL_USER;
    assert.equal(resolveSpecialCheckoutEligible(user, "test@example.com", 1), false);
  });

  it("returns false for non-matching email", () => {
    process.env.SPECIAL_LEVEL_USER = "pri_special_test";
    assert.equal(resolveSpecialCheckoutEligible(user, "other@example.com", 1), false);
  });
});

describe("buildSpecialSeasonOffer", () => {
  it("uses formatCurrency priceLabel", () => {
    const offer = buildSpecialSeasonOffer("2025", 1);
    assert.equal(offer.skuTier, "SPECIAL");
    assert.equal(offer.priceUsd, 1);
    assert.equal(offer.priceCents, 100);
    assert.equal(offer.taxSeason, "2025");
    assert.equal(offer.priceDisplay, "internal_test");
    assert.equal(offer.priceLabel, "$1.00");
  });
});
