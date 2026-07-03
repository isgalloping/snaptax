import assert from "node:assert/strict";
import { test } from "node:test";
import { isFounderWidgetVisible } from "./visibility.ts";

test("hidden when program disabled", () => {
  assert.equal(
    isFounderWidgetVisible({
      enabled: false,
      claimedCount: 0,
      founderStatus: "none",
    }),
    false,
  );
});

test("hidden when claimedCount=50", () => {
  assert.equal(
    isFounderWidgetVisible({
      enabled: true,
      claimedCount: 50,
      founderStatus: "none",
    }),
    false,
  );
});

test("hidden when founderStatus=active", () => {
  assert.equal(
    isFounderWidgetVisible({
      enabled: true,
      claimedCount: 10,
      founderStatus: "active",
    }),
    false,
  );
});

test("hidden when currentSeasonEntitled", () => {
  assert.equal(
    isFounderWidgetVisible({
      enabled: true,
      claimedCount: 10,
      founderStatus: "none",
      currentSeasonEntitled: true,
    }),
    false,
  );
});

test("visible for guest (none) when seats remain", () => {
  assert.equal(
    isFounderWidgetVisible({
      enabled: true,
      claimedCount: 10,
      founderStatus: "none",
    }),
    true,
  );
});

test("visible for lapsed founder", () => {
  assert.equal(
    isFounderWidgetVisible({
      enabled: true,
      claimedCount: 10,
      founderStatus: "lapsed",
    }),
    true,
  );
});
