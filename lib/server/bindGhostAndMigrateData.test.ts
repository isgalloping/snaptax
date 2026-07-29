import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bindGhostAndMigrateData } from "@/lib/server/bindGhostAndMigrateData";

describe("bindGhostAndMigrateData", () => {
  it("creates binding and migrates data in one db client", async () => {
    const order: string[] = [];

    const result = await bindGhostAndMigrateData(
      "user-1",
      "ghost-9",
      { existingGhostBinding: null, userBinding: null },
      {
        snaptaxGhostAccount: {
          create: async () => {
            order.push("binding");
            return {};
          },
          update: async () => ({}),
          findUnique: async () => null,
        },
        snaptaxReceipt: {
          findMany: async () => [],
          updateMany: async () => {
            order.push("receipts");
            return { count: 1 };
          },
        },
        snaptaxReceiptEvent: {
          findMany: async () => [],
          updateMany: async () => ({ count: 0 }),
        },
        snaptaxReceiptLifecycleSnapshot: {
          findMany: async () => [],
          updateMany: async () => ({ count: 0 }),
        },
        snaptaxReceiptSyncCursor: {
          findUnique: async () => null,
          upsert: async () => ({}),
          deleteMany: async () => ({ count: 0 }),
        },
      },
    );

    assert.deepEqual(order, ["binding", "receipts"]);
    assert.equal(result.rebindPreviousGhostId, null);
  });

  it("returns rebindPreviousGhostId when ghost id changes", async () => {
    const result = await bindGhostAndMigrateData(
      "user-1",
      "ghost-new",
      {
        existingGhostBinding: null,
        userBinding: { ghostId: "ghost-old" },
      },
      {
        snaptaxGhostAccount: {
          create: async () => ({}),
          update: async ({ data }) => {
            assert.equal(data.ghostId, "ghost-new");
            return {};
          },
          findUnique: async () => null,
        },
        snaptaxReceipt: {
          findMany: async () => [],
          updateMany: async () => ({ count: 0 }),
        },
        snaptaxReceiptEvent: {
          findMany: async () => [],
          updateMany: async () => ({ count: 0 }),
        },
        snaptaxReceiptLifecycleSnapshot: {
          findMany: async () => [],
          updateMany: async () => ({ count: 0 }),
        },
        snaptaxReceiptSyncCursor: {
          findUnique: async () => null,
          upsert: async () => ({}),
          deleteMany: async () => ({ count: 0 }),
        },
      },
    );

    assert.equal(result.rebindPreviousGhostId, "ghost-old");
  });
});
