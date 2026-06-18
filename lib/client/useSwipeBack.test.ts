import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_SWIPE_BACK_THRESHOLD_PX,
  shouldTriggerSwipeBack,
} from "./useSwipeBack.ts";

describe("shouldTriggerSwipeBack", () => {
  it("triggers on horizontal swipe above threshold (right)", () => {
    assert.equal(shouldTriggerSwipeBack(80, 10), true);
  });

  it("triggers on horizontal swipe above threshold (left)", () => {
    assert.equal(shouldTriggerSwipeBack(-80, 10), true);
  });

  it("rejects sub-threshold movement", () => {
    assert.equal(shouldTriggerSwipeBack(40, 0), false);
    assert.equal(shouldTriggerSwipeBack(-40, 0), false);
  });

  it("rejects vertical-dominant movement", () => {
    assert.equal(shouldTriggerSwipeBack(80, 100), false);
  });

  it("accepts at exact threshold when horizontal dominates", () => {
    assert.equal(
      shouldTriggerSwipeBack(DEFAULT_SWIPE_BACK_THRESHOLD_PX, 0),
      true,
    );
  });
});
