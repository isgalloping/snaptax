import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { visibleReceiptsForOnboarding } from "./onboardingReceipts";
import type { Receipt } from "@/lib/types";

const shadowDemo: Receipt = {
  id: "onboarding-demo-receipt",
  status: "processing",
  merchant: "SAMPLE: Builder Depot",
  isOnboardingDemo: true,
  timestamp: "2026-06-14T12:00:00.000Z",
};

const doneDemo: Receipt = {
  ...shadowDemo,
  status: "done",
  taxAmount: 28.5,
};

const realReceipt: Receipt = {
  id: "real-1",
  status: "done",
  merchant: "Gas Station",
  timestamp: "2026-06-14T12:00:00.000Z",
};

describe("visibleReceiptsForOnboarding", () => {
  it("hides processing demo in stage_1", () => {
    const visible = visibleReceiptsForOnboarding([shadowDemo], "stage_1");
    assert.deepEqual(visible, []);
  });

  it("keeps done demo in stage_aha", () => {
    const visible = visibleReceiptsForOnboarding([doneDemo], "stage_aha");
    assert.deepEqual(visible, [doneDemo]);
  });

  it("keeps real receipts in stage_1", () => {
    const visible = visibleReceiptsForOnboarding(
      [shadowDemo, realReceipt],
      "stage_1",
    );
    assert.deepEqual(visible, [realReceipt]);
  });
});
