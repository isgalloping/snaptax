import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isFounderSkuTier, resolveFounderSeatSkuTier } from "./founderSkuTier";

describe("isFounderSkuTier", () => {
  it("accepts founder seat tiers", () => {
    assert.equal(isFounderSkuTier("FOUNDER_LEVEL_SUPER"), true);
    assert.equal(isFounderSkuTier("EARLY"), true);
    assert.equal(isFounderSkuTier("FOUNDER"), true);
  });

  it("rejects default, special, null, and unknown", () => {
    assert.equal(isFounderSkuTier("DEFAULT"), false);
    assert.equal(isFounderSkuTier("SPECIAL"), false);
    assert.equal(isFounderSkuTier(undefined), false);
  });
});

describe("resolveFounderSeatSkuTier", () => {
  it("prefers intent tier when valid", () => {
    assert.equal(
      resolveFounderSeatSkuTier({
        intentSkuTier: "EARLY",
        customDataSkuTier: "FOUNDER",
        legacyUserIdPath: true,
      }),
      "EARLY",
    );
  });

  it("ignores null intent and uses legacy customData when enabled", () => {
    assert.equal(
      resolveFounderSeatSkuTier({
        intentSkuTier: null,
        customDataSkuTier: "FOUNDER_LEVEL_SUPER",
        legacyUserIdPath: true,
      }),
      "FOUNDER_LEVEL_SUPER",
    );
  });

  it("returns undefined when intent is null and legacy path is off", () => {
    assert.equal(
      resolveFounderSeatSkuTier({
        intentSkuTier: null,
        customDataSkuTier: "FOUNDER",
        legacyUserIdPath: false,
      }),
      undefined,
    );
  });
});
