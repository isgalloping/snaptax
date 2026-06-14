import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ONBOARDING_DEMO_RECEIPT_ID,
  ONBOARDING_DEMO_TAX_SAVED,
  createShadowDemoReceipt,
  completeDemoReceipt,
} from "./demoReceipt";

describe("createShadowDemoReceipt", () => {
  it("creates shadow receipt at zero tax", () => {
    const receipt = createShadowDemoReceipt();

    assert.equal(receipt.id, ONBOARDING_DEMO_RECEIPT_ID);
    assert.equal(receipt.isOnboardingDemo, true);
    assert.equal(receipt.status, "processing");
    assert.equal(receipt.merchant, "SAMPLE: Builder Depot");
    assert.equal(receipt.amount, 193.12);
    assert.equal(receipt.taxAmount, 0);
    assert.equal(receipt.subtitle, "Pending Test");
  });
});

describe("completeDemoReceipt", () => {
  it("completes demo receipt with fixed tax saved", () => {
    const shadow = createShadowDemoReceipt();
    const receipt = completeDemoReceipt(shadow);

    assert.equal(receipt.status, "done");
    assert.equal(receipt.taxAmount, ONBOARDING_DEMO_TAX_SAVED);
    assert.equal(receipt.subtitle, "COMPLETE");
  });
});
