import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { collectProcessingIds, newestProcessingId } from "./processingQueue";
import { utcNow } from "@/lib/time/utc";

describe("collectProcessingIds", () => {
  it("excludes onboarding demo receipts", () => {
    const ids = collectProcessingIds([
      {
        id: "onboarding-demo-receipt",
        status: "processing",
        isOnboardingDemo: true,
      },
      { id: "real-1", status: "processing" },
    ]);
    assert.deepEqual(ids, ["real-1"]);
  });
});

describe("newestProcessingId", () => {
  it("ignores onboarding demo when picking newest processing receipt", () => {
    const now = utcNow();
    const id = newestProcessingId([
      {
        id: "onboarding-demo-receipt",
        status: "processing",
        isOnboardingDemo: true,
        timestamp: now,
      },
      {
        id: "real-1",
        status: "processing",
        timestamp: new Date(now.getTime() - 60_000),
      },
    ]);
    assert.equal(id, "real-1");
  });
});
