import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { founderPriceCentsToUsd, founderPriceUsdToCents } from "./pricing.ts";

describe("founder pricing", () => {
  it("converts USD to cents for Paddle", () => {
    assert.equal(founderPriceUsdToCents(5), 500);
    assert.equal(founderPriceUsdToCents(29), 2900);
  });

  it("converts cents to USD for display", () => {
    assert.equal(founderPriceCentsToUsd(500), 5);
    assert.equal(founderPriceCentsToUsd(2900), 29);
  });
});
