import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeMerchantName } from "./normalizeMerchantName.ts";

describe("normalizeMerchantName", () => {
  it("keeps a single store name unchanged", () => {
    assert.equal(normalizeMerchantName("91便捷超市"), "91便捷超市");
    assert.equal(normalizeMerchantName("  Home Depot  "), "Home Depot");
  });

  it("uses the first segment when AI joined names with slash", () => {
    assert.equal(
      normalizeMerchantName("Shanghai Disneyland / Park restaurant (P6016)"),
      "Shanghai Disneyland",
    );
  });

  it("splits on pipe separators", () => {
    assert.equal(normalizeMerchantName("Store A | Store B"), "Store A");
  });

  it("strips trailing register codes in parentheses", () => {
    assert.equal(normalizeMerchantName("Corner Cafe (P6016)"), "Corner Cafe");
  });
});
