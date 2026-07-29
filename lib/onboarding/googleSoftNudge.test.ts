import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Receipt } from "@/lib/types";
import {
  countDoneRealReceipts,
  isGoogleSoftNudgeEligible,
} from "./googleSoftNudge";

function receipt(partial: Partial<Receipt> & Pick<Receipt, "id">): Receipt {
  return {
    id: partial.id,
    status: partial.status ?? "done",
    amount: partial.amount ?? 10,
    taxAmount: partial.taxAmount ?? 2,
    category: partial.category ?? "TOOLS",
    merchant: partial.merchant ?? "Test",
    capturedAt: partial.capturedAt ?? "2026-01-01T00:00:00.000Z",
    updatedAt: partial.updatedAt ?? "2026-01-01T00:00:00.000Z",
    isOnboardingDemo: partial.isOnboardingDemo,
  } as Receipt;
}

describe("googleSoftNudge", () => {
  it("counts done receipts excluding onboarding demo", () => {
    const receipts = [
      receipt({ id: "1", status: "done" }),
      receipt({ id: "2", status: "done", isOnboardingDemo: true }),
      receipt({ id: "3", status: "processing" }),
      receipt({ id: "4", status: "done" }),
    ];
    assert.equal(countDoneRealReceipts(receipts), 2);
  });

  it("requires three done receipts, completed onboarding, and no dismiss", () => {
    assert.equal(
      isGoogleSoftNudgeEligible({
        doneCount: 2,
        isSignedIn: false,
        onboardingCompleted: true,
        softDismissed: false,
        shownThisSession: false,
      }),
      false,
    );
    assert.equal(
      isGoogleSoftNudgeEligible({
        doneCount: 3,
        isSignedIn: false,
        onboardingCompleted: true,
        softDismissed: false,
        shownThisSession: false,
      }),
      true,
    );
    assert.equal(
      isGoogleSoftNudgeEligible({
        doneCount: 3,
        isSignedIn: true,
        onboardingCompleted: true,
        softDismissed: false,
        shownThisSession: false,
      }),
      false,
    );
    assert.equal(
      isGoogleSoftNudgeEligible({
        doneCount: 3,
        isSignedIn: false,
        onboardingCompleted: false,
        softDismissed: false,
        shownThisSession: false,
      }),
      false,
    );
    assert.equal(
      isGoogleSoftNudgeEligible({
        doneCount: 3,
        isSignedIn: false,
        onboardingCompleted: true,
        softDismissed: true,
        shownThisSession: false,
      }),
      false,
    );
    assert.equal(
      isGoogleSoftNudgeEligible({
        doneCount: 3,
        isSignedIn: false,
        onboardingCompleted: true,
        softDismissed: false,
        shownThisSession: true,
      }),
      false,
    );
  });
});
