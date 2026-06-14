import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ONBOARDING_DEMO_RECEIPT_ID } from "./demoReceipt";
import { skipOnboarding } from "./skipOnboarding";

describe("skipOnboarding", () => {
  it("exports an async function", () => {
    assert.equal(typeof skipOnboarding, "function");
    assert.equal(skipOnboarding.constructor.name, "AsyncFunction");
  });

  it("targets the onboarding demo receipt id", () => {
    assert.equal(ONBOARDING_DEMO_RECEIPT_ID, "onboarding-demo-receipt");
  });
});
