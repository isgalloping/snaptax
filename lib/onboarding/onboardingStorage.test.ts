import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readOnboardFlag } from "./onboardingStorage";

describe("onboardingStorage flags", () => {
  it("readOnboardFlag returns false when localStorage unavailable", () => {
    assert.equal(readOnboardFlag("__test_unset_key__"), false);
  });
});
