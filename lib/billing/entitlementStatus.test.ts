import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextEntitlementStatus } from "./entitlementStatus.ts";
import { isSeasonEntitlementPaid } from "./isSeasonEntitlementPaid.ts";

describe("nextEntitlementStatus", () => {
  it("approved refund from active -> refunded", () => {
    assert.deepEqual(
      nextEntitlementStatus({
        current: "active",
        action: "refund",
        adjustmentStatus: "approved",
      }),
      { next: "refunded", applied: true, reason: "refund_approved" },
    );
  });

  it("ignores pending refund", () => {
    const r = nextEntitlementStatus({
      current: "active",
      action: "refund",
      adjustmentStatus: "pending_approval",
    });
    assert.equal(r.applied, false);
    assert.equal(r.next, "active");
  });

  it("chargeback_warning pauses active", () => {
    assert.equal(
      nextEntitlementStatus({
        current: "active",
        action: "chargeback_warning",
      }).next,
      "disputed",
    );
  });

  it("reverse restores disputed only", () => {
    assert.equal(
      nextEntitlementStatus({
        current: "disputed",
        action: "chargeback_reverse",
      }).next,
      "active",
    );
    assert.equal(
      nextEntitlementStatus({
        current: "refunded",
        action: "chargeback_reverse",
      }).applied,
      false,
    );
  });

  it("refunded is terminal for disputes", () => {
    assert.equal(
      nextEntitlementStatus({
        current: "refunded",
        action: "chargeback",
      }).applied,
      false,
    );
  });

  it("approved refund upgrades disputed", () => {
    assert.equal(
      nextEntitlementStatus({
        current: "disputed",
        action: "refund",
        adjustmentStatus: "approved",
      }).next,
      "refunded",
    );
  });
});

describe("isSeasonEntitlementPaid", () => {
  it("only active is paid", () => {
    assert.equal(isSeasonEntitlementPaid("active"), true);
    assert.equal(isSeasonEntitlementPaid("disputed"), false);
    assert.equal(isSeasonEntitlementPaid("refunded"), false);
    assert.equal(isSeasonEntitlementPaid(null), false);
  });
});
