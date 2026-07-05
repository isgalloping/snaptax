import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveHeaderTaxSaved } from "./resolveHeaderTaxSaved";

describe("resolveHeaderTaxSaved", () => {
  it("prefers onboarding display override", () => {
    assert.equal(
      resolveHeaderTaxSaved({
        displayTaxSaved: 42,
        seasonTotalTaxSaved: 10,
        taxSavedFallback: 5,
      }),
      42,
    );
  });

  it("uses season summary when no override", () => {
    assert.equal(
      resolveHeaderTaxSaved({
        displayTaxSaved: null,
        seasonTotalTaxSaved: 10,
        taxSavedFallback: 5,
      }),
      10,
    );
  });

  it("falls back to taxSaved state when summary missing", () => {
    assert.equal(
      resolveHeaderTaxSaved({
        displayTaxSaved: null,
        seasonTotalTaxSaved: null,
        taxSavedFallback: 5,
      }),
      5,
    );
  });

  it("returns null when all inputs nullish", () => {
    assert.equal(
      resolveHeaderTaxSaved({
        displayTaxSaved: null,
        seasonTotalTaxSaved: null,
        taxSavedFallback: null,
      }),
      null,
    );
  });
});
