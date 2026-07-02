import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FOUNDER_SEATS_TOTAL,
  nextSeatNumber,
  tierDisplayLabel,
  tierForSeat,
} from "./tiers.ts";

test("FOUNDER_SEATS_TOTAL is 50", () => {
  assert.equal(FOUNDER_SEATS_TOTAL, 50);
});

test("tierForSeat maps seats 1-10 to FOUNDER_LEVEL_SUPER", () => {
  assert.equal(tierForSeat(1), "FOUNDER_LEVEL_SUPER");
  assert.equal(tierForSeat(10), "FOUNDER_LEVEL_SUPER");
});

test("tierForSeat maps seats 11-30 to EARLY", () => {
  assert.equal(tierForSeat(11), "EARLY");
  assert.equal(tierForSeat(30), "EARLY");
});

test("tierForSeat maps seats 31-50 to FOUNDER", () => {
  assert.equal(tierForSeat(31), "FOUNDER");
  assert.equal(tierForSeat(50), "FOUNDER");
});

test("tierForSeat returns null for out-of-range seats", () => {
  assert.equal(tierForSeat(0), null);
  assert.equal(tierForSeat(51), null);
});

test("nextSeatNumber returns next seat when seats remain", () => {
  assert.equal(nextSeatNumber(0), 1);
  assert.equal(nextSeatNumber(49), 50);
});

test("nextSeatNumber returns null when all seats claimed", () => {
  assert.equal(nextSeatNumber(50), null);
});

test("tierDisplayLabel returns human-readable labels", () => {
  assert.equal(tierDisplayLabel("FOUNDER_LEVEL_SUPER"), "Super Founder");
  assert.equal(tierDisplayLabel("EARLY"), "Early Founder");
  assert.equal(tierDisplayLabel("FOUNDER"), "Founder");
  assert.equal(tierDisplayLabel("DEFAULT"), "Standard");
});
