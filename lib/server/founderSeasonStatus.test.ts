import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveEffectiveFounderStatus,
  shouldPersistFounderStatusSync,
} from "./founderSeasonStatus.ts";

describe("resolveEffectiveFounderStatus", () => {
  it("active founder with current season entitlement stays active", () => {
    assert.equal(
      resolveEffectiveFounderStatus({
        storedStatus: "active",
        founderNumber: 5,
        currentSeasonEntitled: true,
      }),
      "active",
    );
  });

  it("active founder without current season entitlement becomes lapsed", () => {
    assert.equal(
      resolveEffectiveFounderStatus({
        storedStatus: "active",
        founderNumber: 5,
        currentSeasonEntitled: false,
      }),
      "lapsed",
    );
  });

  it("lapsed founder without entitlement stays lapsed", () => {
    assert.equal(
      resolveEffectiveFounderStatus({
        storedStatus: "lapsed",
        founderNumber: 5,
        currentSeasonEntitled: false,
      }),
      "lapsed",
    );
  });

  it("lapsed founder with new season payment becomes active", () => {
    assert.equal(
      resolveEffectiveFounderStatus({
        storedStatus: "lapsed",
        founderNumber: 5,
        currentSeasonEntitled: true,
      }),
      "active",
    );
  });

  it("non-founder without seat returns none", () => {
    assert.equal(
      resolveEffectiveFounderStatus({
        storedStatus: "none",
        founderNumber: null,
        currentSeasonEntitled: false,
      }),
      "none",
    );
  });
});

describe("shouldPersistFounderStatusSync", () => {
  it("persists active to lapsed when founder has seat", () => {
    assert.equal(
      shouldPersistFounderStatusSync("active", "lapsed", 3),
      true,
    );
  });

  it("skips when no founder number", () => {
    assert.equal(
      shouldPersistFounderStatusSync("active", "none", null),
      false,
    );
  });
});
