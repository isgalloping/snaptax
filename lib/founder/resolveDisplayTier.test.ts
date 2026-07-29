import assert from "node:assert/strict";
import test from "node:test";
import { resolveDisplayTier } from "./resolveDisplayTier";

test("resolveDisplayTier uses next seat tier for new viewers", () => {
  assert.equal(
    resolveDisplayTier({
      claimedCount: 0,
      user: null,
    }),
    "FOUNDER_LEVEL_SUPER",
  );

  assert.equal(
    resolveDisplayTier({
      claimedCount: 10,
      user: null,
    }),
    "EARLY",
  );
});

test("resolveDisplayTier uses locked tier for active founders", () => {
  assert.equal(
    resolveDisplayTier({
      claimedCount: 20,
      user: {
        founderNumber: 3,
        founderStatus: "active",
        founderTier: "FOUNDER_LEVEL_SUPER",
      },
    }),
    "FOUNDER_LEVEL_SUPER",
  );
});

test("resolveDisplayTier uses DEFAULT for lapsed founders", () => {
  assert.equal(
    resolveDisplayTier({
      claimedCount: 20,
      user: {
        founderNumber: 3,
        founderStatus: "lapsed",
        founderTier: "FOUNDER_LEVEL_SUPER",
      },
    }),
    "DEFAULT",
  );
});

test("resolveDisplayTier ignores SPECIAL tier (internal checkout only)", () => {
  assert.equal(
    resolveDisplayTier({
      claimedCount: 0,
      user: {
        founderNumber: null,
        founderStatus: "none",
        founderTier: "SPECIAL",
      },
    }),
    "FOUNDER_LEVEL_SUPER",
  );
});
