import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { finalizeFounderPurchase } from "./finalizeFounderPurchase.ts";

describe("finalizeFounderPurchase", () => {
  it("polls entitlement before refreshing seasonPaid", async () => {
    const order: string[] = [];

    await finalizeFounderPurchase({
      season: "2027",
      pollEntitlementReady: async () => {
        order.push("poll");
        return true;
      },
      refreshSeasonPaid: async () => {
        order.push("refresh");
      },
      waitForFounderActive: async () => {
        order.push("founder");
        return true;
      },
    });

    assert.deepEqual(order, ["poll", "refresh", "founder"]);
  });
});
