import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applySeasonEntitlementAdjustment } from "./applySeasonEntitlementAdjustment.ts";

describe("applySeasonEntitlementAdjustment", () => {
  it("returns txn_not_found when missing", async () => {
    const result = await applySeasonEntitlementAdjustment(
      {
        transactionId: "txn-missing",
        action: "refund",
        adjustmentStatus: "approved",
      },
      { findByTransaction: async () => null },
    );
    assert.deepEqual(result, { applied: false, reason: "txn_not_found" });
  });

  it("applies approved refund to matching txn only", async () => {
    let updated: unknown;
    const result = await applySeasonEntitlementAdjustment(
      {
        transactionId: "txn-1",
        action: "refund",
        adjustmentStatus: "approved",
      },
      {
        findByTransaction: async (id) => {
          assert.equal(id, "txn-1");
          return { id: "ent-1", status: "active" };
        },
        updateStatus: async (id, data) => {
          updated = { id, data };
        },
        now: () => new Date("2026-07-15T12:00:00.000Z"),
      },
    );
    assert.equal(result.applied, true);
    assert.equal(result.statusAfter, "refunded");
    assert.deepEqual(updated, {
      id: "ent-1",
      data: {
        status: "refunded",
        statusReason: "refund_approved",
        statusUpdatedAt: new Date("2026-07-15T12:00:00.000Z"),
      },
    });
  });
});
