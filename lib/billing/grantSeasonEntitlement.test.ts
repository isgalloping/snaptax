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
        createEntitlement: async () => {
          calls.push("create");
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

  it("updates existing season entitlement instead of creating duplicate", async () => {
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
        }),
        updateEntitlement: async () => {
          calls.push("update");
        },
        now: () => new Date("2026-06-13T12:00:00.000Z"),
      },
    );

    assert.deepEqual(result, {
      created: false,
      duplicateSeason: true,
      transactionId: "txn-1",
    });
    assert.deepEqual(calls, ["update"]);
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
});
