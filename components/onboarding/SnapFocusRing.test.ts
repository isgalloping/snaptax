import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SNAP_FOCUS_RING_CLASS } from "./SnapFocusRing";

describe("SnapFocusRing", () => {
  it("exports root class for overlay styling", () => {
    assert.equal(SNAP_FOCUS_RING_CLASS, "snap-focus-ring");
  });
});
