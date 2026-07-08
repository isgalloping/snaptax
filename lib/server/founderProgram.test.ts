import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeFounderStatus,
  resolveFounderCheckoutSkuTier,
} from "./founderProgram.ts";

describe("normalizeFounderStatus", () => {
  it("preserves active status", () => {
    assert.equal(normalizeFounderStatus("active"), "active");
  });

  it("preserves lapsed status", () => {
    assert.equal(normalizeFounderStatus("lapsed"), "lapsed");
  });

  it("maps null to none", () => {
    assert.equal(normalizeFounderStatus(null), "none");
  });

  it("maps undefined to none", () => {
    assert.equal(normalizeFounderStatus(undefined), "none");
  });

  it("maps unknown values to none", () => {
    assert.equal(normalizeFounderStatus("pending"), "none");
    assert.equal(normalizeFounderStatus(""), "none");
    assert.equal(normalizeFounderStatus("none"), "none");
  });
});

describe("resolveFounderCheckoutSkuTier", () => {
  it("uses locked tier for active founder renewal", () => {
    const result = resolveFounderCheckoutSkuTier({
      user: {
        founderStatus: "active",
        founderTier: "EARLY",
        founderNumber: 15,
      },
      claimedCount: 20,
      programOpen: true,
    });
    assert.deepEqual(result, { ok: true, skuTier: "EARLY" });
  });

  it("uses DEFAULT for lapsed founder renewal", () => {
    const result = resolveFounderCheckoutSkuTier({
      user: {
        founderStatus: "lapsed",
        founderTier: "FOUNDER_LEVEL_SUPER",
        founderNumber: 3,
      },
      claimedCount: 50,
      programOpen: false,
    });
    assert.deepEqual(result, { ok: true, skuTier: "DEFAULT" });
  });

  it("resolves next seat tier for first founder purchase", () => {
    const result = resolveFounderCheckoutSkuTier({
      user: {
        founderStatus: "none",
        founderTier: null,
        founderNumber: null,
      },
      claimedCount: 0,
      programOpen: true,
    });
    assert.deepEqual(result, { ok: true, skuTier: "FOUNDER_LEVEL_SUPER" });
  });

  it("maps seat 11 to EARLY tier", () => {
    const result = resolveFounderCheckoutSkuTier({
      user: {
        founderStatus: "none",
        founderTier: null,
        founderNumber: null,
      },
      claimedCount: 10,
      programOpen: true,
    });
    assert.deepEqual(result, { ok: true, skuTier: "EARLY" });
  });

  it("returns 409 when program full and user has no founder seat", () => {
    const result = resolveFounderCheckoutSkuTier({
      user: {
        founderStatus: "none",
        founderTier: null,
        founderNumber: null,
      },
      claimedCount: 50,
      programOpen: false,
    });
    assert.deepEqual(result, { ok: false, error: "FOUNDER_PROGRAM_FULL" });
  });

  it("falls back to DEFAULT for ineligible user with founder number but no tier", () => {
    const result = resolveFounderCheckoutSkuTier({
      user: {
        founderStatus: "none",
        founderTier: null,
        founderNumber: 5,
      },
      claimedCount: 10,
      programOpen: true,
    });
    assert.deepEqual(result, { ok: true, skuTier: "DEFAULT" });
  });
});
