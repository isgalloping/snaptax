import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isEdgeTouchStart,
  isSnapNavPopState,
  shouldConfirmExitFromPopState,
  shouldTriggerEdgeExitSwipe,
} from "./homeExitGuard.ts";

describe("isEdgeTouchStart", () => {
  it("detects left and right edges", () => {
    assert.equal(isEdgeTouchStart(10, 400), true);
    assert.equal(isEdgeTouchStart(390, 400), true);
    assert.equal(isEdgeTouchStart(200, 400), false);
  });
});

describe("shouldTriggerEdgeExitSwipe", () => {
  it("requires horizontal swipe above threshold", () => {
    assert.equal(shouldTriggerEdgeExitSwipe(80, 10), true);
    assert.equal(shouldTriggerEdgeExitSwipe(-80, 10), true);
    assert.equal(shouldTriggerEdgeExitSwipe(40, 0), false);
  });
});

describe("shouldConfirmExitFromPopState", () => {
  it("confirms when leaving snap history at home root", () => {
    assert.equal(shouldConfirmExitFromPopState(null, true), true);
    assert.equal(
      shouldConfirmExitFromPopState({ snap1099: "home" }, true),
      false,
    );
  });

  it("ignores when not at home root", () => {
    assert.equal(shouldConfirmExitFromPopState(null, false), false);
  });
});

describe("isSnapNavPopState", () => {
  it("detects snap1099 state objects", () => {
    assert.equal(isSnapNavPopState({ snap1099: "settings" }), true);
    assert.equal(isSnapNavPopState({}), false);
    assert.equal(isSnapNavPopState(null), false);
  });
});
