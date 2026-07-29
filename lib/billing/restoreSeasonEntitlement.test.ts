import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { restoreSeasonEntitlementActive } from "./restoreSeasonEntitlement.ts";

describe("restoreSeasonEntitlementActive", () => {
  it("restores disputed to active", async () => {
    let updated: unknown;
    const result = await restoreSeasonEntitlementActive(
      { userId: "u1", taxSeason: "2026" },
      {
        find: async () => ({ id: "ent-1", status: "disputed" }),
        update: async (id, data) => {
          updated = { id, data };
        },
        now: () => new Date("2026-07-15T00:00:00.000Z"),
      },
    );
    assert.deepEqual(result, { ok: true, reason: "manual_restore" });
    assert.deepEqual(updated, {
      id: "ent-1",
      data: {
        status: "active",
        statusReason: "manual_restore",
        statusUpdatedAt: new Date("2026-07-15T00:00:00.000Z"),
      },
    });
  });

  it("refuses refunded", async () => {
    const result = await restoreSeasonEntitlementActive(
      { userId: "u1", taxSeason: "2026" },
      { find: async () => ({ id: "ent-1", status: "refunded" }) },
    );
    assert.deepEqual(result, {
      ok: false,
      reason: "refunded_use_repurchase",
    });
  });
});
