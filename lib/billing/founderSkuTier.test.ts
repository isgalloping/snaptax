import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveFounderSeatSkuTier } from "./founderSkuTier";

describe("resolveFounderSeatSkuTier", () => {
  it("uses founder tier from checkout intent", () => {
    assert.equal(
      resolveFounderSeatSkuTier({
        intentSkuTier: "FOUNDER",
        customDataSkuTier: "DEFAULT",
        legacyUserIdPath: false,
      }),
      "FOUNDER",
    );
  });

  it("ignores forged customData tier for intent-backed checkout", () => {
    assert.equal(
      resolveFounderSeatSkuTier({
        intentSkuTier: "DEFAULT",
        customDataSkuTier: "FOUNDER_LEVEL_SUPER",
        legacyUserIdPath: false,
      }),
      undefined,
    );
  });

  it("keeps legacy customData tier only for legacy userId grants", () => {
    assert.equal(
      resolveFounderSeatSkuTier({
        intentSkuTier: null,
        customDataSkuTier: "EARLY",
        legacyUserIdPath: true,
      }),
      "EARLY",
    );
  });
});
