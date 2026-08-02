import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveFounderSeatSkuTier } from "./webhookSkuTier";

describe("resolveFounderSeatSkuTier", () => {
  it("uses only intent sku tier for intent-backed webhooks", () => {
    const result = resolveFounderSeatSkuTier({
      intentSkuTier: "DEFAULT",
      customDataSkuTier: "FOUNDER",
      legacyUserIdPath: false,
    });
    assert.equal(result, undefined);
  });

  it("allows founder intent sku tier for intent-backed webhooks", () => {
    const result = resolveFounderSeatSkuTier({
      intentSkuTier: "FOUNDER",
      customDataSkuTier: "DEFAULT",
      legacyUserIdPath: false,
    });
    assert.equal(result, "FOUNDER");
  });

  it("allows custom_data sku tier only on legacy userId grants", () => {
    const result = resolveFounderSeatSkuTier({
      intentSkuTier: undefined,
      customDataSkuTier: "EARLY",
      legacyUserIdPath: true,
    });
    assert.equal(result, "EARLY");
  });
});
