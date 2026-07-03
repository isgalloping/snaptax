import assert from "node:assert/strict";
import test from "node:test";
import {
  FOUNDER_SCARCITY_URGENT_THRESHOLD,
  isFounderScarcityUrgent,
} from "./types";

test("isFounderScarcityUrgent at threshold", () => {
  assert.equal(isFounderScarcityUrgent(FOUNDER_SCARCITY_URGENT_THRESHOLD), true);
  assert.equal(isFounderScarcityUrgent(FOUNDER_SCARCITY_URGENT_THRESHOLD + 1), false);
});

test("isFounderScarcityUrgent ignores zero or negative", () => {
  assert.equal(isFounderScarcityUrgent(0), false);
  assert.equal(isFounderScarcityUrgent(-1), false);
});
