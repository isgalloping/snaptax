import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { grantPaddleSeasonEntitlement } from "./grantSeasonEntitlement.ts";

describe("grantPaddleSeasonEntitlement", () => {
  it("creates a new entitlement when none exists", async () => {
    const calls: string[] = [];

    const result = await grantPaddleSeasonEntitlement(
      {
        userId: "user-1",
        taxSeason: "2026",
        transactionId: "txn-1",
        amountUsd: 49,
      },
      {
        findBySeason: async () => null,
        findByTransaction: async () => null,
        createEntitlement: async (data) => {
          calls.push("create");
          assert.equal(data.status, "active");
          assert.equal(data.transactionId, "txn-1");
        },
        now: () => new Date("2026-06-13T12:00:00.000Z"),
      },
    );

    assert.deepEqual(result, {
      created: true,
      duplicateSeason: false,
      transactionId: "txn-1",
    });
    assert.deepEqual(calls, ["create"]);
  });

  it("repurchase replaces transactionId and sets active", async () => {
    let updated: unknown;
    const result = await grantPaddleSeasonEntitlement(
      {
        userId: "user-1",
        taxSeason: "2026",
        transactionId: "txn-2",
        amountUsd: 49,
      },
      {
        findBySeason: async () => ({
          id: "ent-1",
          transactionId: "txn-1",
          status: "refunded",
        }),
        updateEntitlement: async (_id, data) => {
          updated = data;
        },
        now: () => new Date("2026-06-13T12:00:00.000Z"),
      },
    );
    assert.equal(result.transactionId, "txn-2");
    assert.equal(result.duplicateSeason, true);
    assert.deepEqual(updated, {
      paidAt: new Date("2026-06-13T12:00:00.000Z"),
      amount: 49,
      transactionId: "txn-2",
      status: "active",
      statusReason: "purchase_completed",
      statusUpdatedAt: new Date("2026-06-13T12:00:00.000Z"),
    });
  });

  it("updates by transaction id when season lookup misses", async () => {
    const calls: string[] = [];

    const result = await grantPaddleSeasonEntitlement(
      {
        userId: "user-1",
        taxSeason: "2026",
        transactionId: "txn-1",
        amountUsd: 49,
      },
      {
        findBySeason: async () => null,
        findByTransaction: async () => ({
          id: "ent-1",
          transactionId: "txn-1",
        }),
        updateEntitlement: async () => {
          calls.push("update");
        },
        now: () => new Date("2026-06-13T12:00:00.000Z"),
      },
    );

    assert.deepEqual(result, {
      created: false,
      duplicateSeason: false,
      transactionId: "txn-1",
    });
    assert.deepEqual(calls, ["update"]);
  });

  it("skips reactivating refunded entitlement on same transaction replay", async () => {
    const calls: string[] = [];

    const result = await grantPaddleSeasonEntitlement(
      {
        userId: "user-1",
        taxSeason: "2026",
        transactionId: "txn-1",
        amountUsd: 49,
      },
      {
        findBySeason: async () => ({
          id: "ent-1",
          transactionId: "txn-1",
          status: "refunded",
        }),
        updateEntitlement: async () => {
          calls.push("update");
        },
      },
    );

    assert.equal(result.skippedReplay, true);
    assert.deepEqual(calls, []);
  });

  it("skips reactivating disputed entitlement on same transaction replay by txn lookup", async () => {
    const calls: string[] = [];

    const result = await grantPaddleSeasonEntitlement(
      {
        userId: "user-1",
        taxSeason: "2026",
        transactionId: "txn-1",
        amountUsd: 49,
      },
      {
        findBySeason: async () => null,
        findByTransaction: async () => ({
          id: "ent-1",
          transactionId: "txn-1",
          status: "disputed",
        }),
        updateEntitlement: async () => {
          calls.push("update");
        },
      },
    );

    assert.equal(result.skippedReplay, true);
    assert.deepEqual(calls, []);
  });

  it("skips grant when active season already paid with a different transaction", async () => {
    const calls: string[] = [];

    const result = await grantPaddleSeasonEntitlement(
      {
        userId: "user-1",
        taxSeason: "2026",
        transactionId: "txn-2",
        amountUsd: 49,
      },
      {
        findBySeason: async () => ({
          id: "ent-1",
          transactionId: "txn-1",
          status: "active",
        }),
        updateEntitlement: async () => {
          calls.push("update");
        },
      },
    );

    assert.deepEqual(result, {
      created: false,
      duplicateSeason: true,
      transactionId: "txn-1",
      skippedDuplicatePurchase: true,
    });
    assert.deepEqual(calls, []);
  });

  it("updates raced create when concurrent webhook hits unique season constraint", async () => {
    const { Prisma } = await import("@prisma/client");
    let seasonLookups = 0;
    const calls: string[] = [];

    const result = await grantPaddleSeasonEntitlement(
      {
        userId: "user-1",
        taxSeason: "2026",
        transactionId: "txn-2",
        amountUsd: 49,
      },
      {
        findBySeason: async () => {
          seasonLookups += 1;
          if (seasonLookups === 1) return null;
          return { id: "ent-1", transactionId: "txn-1", status: "active" };
        },
        findByTransaction: async () => null,
        createEntitlement: async () => {
          throw new Prisma.PrismaClientKnownRequestError(
            "Unique constraint failed",
            { code: "P2002", clientVersion: "test" },
          );
        },
        updateEntitlement: async () => {
          calls.push("update");
        },
      },
    );

    assert.deepEqual(result, {
      created: false,
      duplicateSeason: true,
      transactionId: "txn-1",
      skippedDuplicatePurchase: true,
    });
    assert.deepEqual(calls, []);
  });

  it("recovers P2002 races via transaction lookup when season lookup misses", async () => {
    const { Prisma } = await import("@prisma/client");
    let txnLookups = 0;

    const result = await grantPaddleSeasonEntitlement(
      {
        userId: "user-1",
        taxSeason: "2026",
        transactionId: "txn-2",
        amountUsd: 49,
      },
      {
        findBySeason: async () => null,
        findByTransaction: async () => {
          txnLookups += 1;
          return txnLookups === 1
            ? null
            : { id: "ent-1", transactionId: "txn-2", status: "active" };
        },
        createEntitlement: async () => {
          throw new Prisma.PrismaClientKnownRequestError(
            "Unique constraint failed",
            { code: "P2002", clientVersion: "test" },
          );
        },
        updateEntitlement: async () => {},
      },
    );

    assert.deepEqual(result, {
      created: false,
      duplicateSeason: false,
      transactionId: "txn-2",
    });
    assert.equal(txnLookups, 2);
  });
});
