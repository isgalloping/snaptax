import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isOnboardingActive,
  isSnapGateActive,
  shouldSkipLegacyCoaches,
} from "./onboardingState";

describe("onboardingState helpers", () => {
  it("stage_1 is active onboarding", () => {
    assert.equal(isOnboardingActive("stage_1"), true);
    assert.equal(isOnboardingActive("completed"), false);
  });

  it("deferred_login triggers snap gate", () => {
    assert.equal(isSnapGateActive("deferred_login"), true);
    assert.equal(isSnapGateActive("stage_1"), false);
  });

  it("completed skips legacy coaches", () => {
    assert.equal(shouldSkipLegacyCoaches("completed"), true);
    assert.equal(shouldSkipLegacyCoaches("deferred_login"), true);
    assert.equal(shouldSkipLegacyCoaches("stage_1"), true);
    assert.equal(shouldSkipLegacyCoaches("not_started"), false);
  });
});
