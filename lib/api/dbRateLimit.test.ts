import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  floorWindowStartMs,
  retryAfterSecFromWindow,
} from "./dbRateLimit";

describe("floorWindowStartMs", () => {
  it("aligns to fixed window boundary", () => {
    const windowMs = 60_000;
    const now = 125_000;
    assert.equal(floorWindowStartMs(now, windowMs), 120_000);
  });
});

describe("retryAfterSecFromWindow", () => {
  it("returns seconds until window ends", () => {
    const windowMs = 60_000;
    const windowStart = 120_000;
    const now = 125_000;
    assert.equal(retryAfterSecFromWindow(windowStart, windowMs, now), 55);
  });

  it("returns at least 1 second", () => {
    assert.equal(retryAfterSecFromWindow(0, 60_000, 59_999), 1);
  });
});
