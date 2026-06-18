import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { visionConfidenceTier } from "./receiptVision.ts";

describe("visionConfidenceTier", () => {
  it("maps low confidence to action", () => {
    assert.equal(visionConfidenceTier(0.4, 10), "action");
  });

  it("maps mid confidence to review", () => {
    assert.equal(visionConfidenceTier(0.6, 10), "review");
  });

  it("maps high confidence to ready", () => {
    assert.equal(visionConfidenceTier(0.8, 10), "ready");
  });

  it("maps zero amount to action", () => {
    assert.equal(visionConfidenceTier(0.9, 0), "action");
  });
});
