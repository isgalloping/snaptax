import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isFirstReceiptCoachEligible,
  isGoogleNudgeEligible,
  isSnapCoachEligible,
} from "./onboardingStorage";

describe("isSnapCoachEligible", () => {
  it("shows for zero receipts when not dismissed and no PWA bar", () => {
    assert.equal(
      isSnapCoachEligible({
        receiptCount: 0,
        dismissed: false,
        pwaBarVisible: false,
      }),
      true,
    );
  });

  it("hides when receipts exist, dismissed, or PWA bar visible", () => {
    assert.equal(
      isSnapCoachEligible({
        receiptCount: 1,
        dismissed: false,
        pwaBarVisible: false,
      }),
      false,
    );
    assert.equal(
      isSnapCoachEligible({
        receiptCount: 0,
        dismissed: true,
        pwaBarVisible: false,
      }),
      false,
    );
    assert.equal(
      isSnapCoachEligible({
        receiptCount: 0,
        dismissed: false,
        pwaBarVisible: true,
      }),
      false,
    );
  });
});

describe("isFirstReceiptCoachEligible", () => {
  it("shows only for first receipt before coach completes", () => {
    assert.equal(
      isFirstReceiptCoachEligible({ receiptCount: 1, coachDone: false }),
      true,
    );
    assert.equal(
      isFirstReceiptCoachEligible({ receiptCount: 2, coachDone: false }),
      false,
    );
    assert.equal(
      isFirstReceiptCoachEligible({ receiptCount: 1, coachDone: true }),
      false,
    );
  });
});

describe("isGoogleNudgeEligible", () => {
  it("shows at three done receipts when unsigned and not dismissed", () => {
    assert.equal(
      isGoogleNudgeEligible({
        doneReceiptCount: 3,
        signedIn: false,
        dismissed: false,
        pwaBarVisible: false,
      }),
      true,
    );
  });

  it("hides when signed in, too few done receipts, dismissed, or PWA bar", () => {
    assert.equal(
      isGoogleNudgeEligible({
        doneReceiptCount: 3,
        signedIn: true,
        dismissed: false,
        pwaBarVisible: false,
      }),
      false,
    );
    assert.equal(
      isGoogleNudgeEligible({
        doneReceiptCount: 2,
        signedIn: false,
        dismissed: false,
        pwaBarVisible: false,
      }),
      false,
    );
  });
});
