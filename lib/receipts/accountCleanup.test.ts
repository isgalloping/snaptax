import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deleteUserAccountDbRecords,
  userAccountReceiptFilter,
} from "./accountCleanup.ts";

describe("userAccountReceiptFilter", () => {
  it("scopes to userId when no ghost binding or historical ghosts", () => {
    assert.deepEqual(userAccountReceiptFilter("user-1", null, []), {
      userId: "user-1",
    });
  });

  it("includes bound ghost orphan receipts when binding exists", () => {
    assert.deepEqual(userAccountReceiptFilter("user-1", "ghost-9", []), {
      OR: [{ userId: "user-1" }, { ghostId: "ghost-9", userId: null }],
    });
  });

  it("includes historical ghost orphan receipts after rebind", () => {
    const filter = userAccountReceiptFilter("user-1", "ghost-new", ["ghost-old"]);
    assert.deepEqual(filter.OR?.[0], { userId: "user-1" });
    const ghostClauses = (filter.OR ?? []).slice(1) as Array<{
      ghostId: string;
      userId: null;
    }>;
    assert.equal(ghostClauses.length, 2);
    const ghostIds = ghostClauses.map((clause) => clause.ghostId).sort();
    assert.deepEqual(ghostIds, ["ghost-new", "ghost-old"]);
    assert.ok(ghostClauses.every((clause) => clause.userId === null));
  });

  it("deduplicates bound ghost id when also present in historical list", () => {
    const filter = userAccountReceiptFilter("user-1", "ghost-9", ["ghost-9"]);
    assert.deepEqual(filter, {
      OR: [{ userId: "user-1" }, { ghostId: "ghost-9", userId: null }],
    });
  });
});

describe("deleteUserAccountDbRecords", () => {
  it("deletes receipts, entitlements, checkout intents, then user", async () => {
    const order: string[] = [];
    const receiptFilter = userAccountReceiptFilter("user-1", "ghost-9", []);

    const counts = await deleteUserAccountDbRecords(
      {
        snaptaxReceipt: {
          deleteMany: async ({ where }) => {
            order.push("receipts");
            assert.deepEqual(where, receiptFilter);
            return { count: 3 };
          },
        },
        snaptaxSeasonEntitlement: {
          deleteMany: async ({ where }) => {
            order.push("entitlements");
            assert.deepEqual(where, { userId: "user-1" });
            return { count: 1 };
          },
        },
        snaptaxCheckoutIntent: {
          deleteMany: async ({ where }) => {
            order.push("checkout");
            assert.deepEqual(where, { userId: "user-1" });
            return { count: 2 };
          },
        },
        snaptaxUser: {
          delete: async ({ where }) => {
            order.push("user");
            assert.deepEqual(where, { id: "user-1" });
          },
        },
      },
      "user-1",
      receiptFilter,
    );

    assert.deepEqual(order, [
      "receipts",
      "entitlements",
      "checkout",
      "user",
    ]);
    assert.deepEqual(counts, {
      receiptCount: 3,
      entitlementCount: 1,
      checkoutIntentCount: 2,
    });
  });

  it("still deletes user when no receipts or billing rows exist", async () => {
    let userDeleted = false;

    const counts = await deleteUserAccountDbRecords(
      {
        snaptaxReceipt: {
          deleteMany: async () => ({ count: 0 }),
        },
        snaptaxSeasonEntitlement: {
          deleteMany: async () => ({ count: 0 }),
        },
        snaptaxCheckoutIntent: {
          deleteMany: async () => ({ count: 0 }),
        },
        snaptaxUser: {
          delete: async () => {
            userDeleted = true;
          },
        },
      },
      "user-empty",
      { userId: "user-empty" },
    );

    assert.equal(userDeleted, true);
    assert.deepEqual(counts, {
      receiptCount: 0,
      entitlementCount: 0,
      checkoutIntentCount: 0,
    });
  });
});
