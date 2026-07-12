import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isOrphanGhostMergeable,
  listHistoricalGhostIdsForUser,
  mergeOrphanGhostData,
} from "@/lib/server/mergeOrphanGhostData";

describe("isOrphanGhostMergeable", () => {
  it("allows unbound ghosts", async () => {
    const ok = await isOrphanGhostMergeable("ghost-9", "user-1", {
      snaptaxGhostAccount: {
        findUnique: async () => null,
      },
    });
    assert.equal(ok, true);
  });

  it("rejects ghosts bound to another user", async () => {
    const ok = await isOrphanGhostMergeable("ghost-9", "user-1", {
      snaptaxGhostAccount: {
        findUnique: async () => ({ userId: "user-2" }),
      },
    });
    assert.equal(ok, false);
  });

  it("allows ghosts already bound to the same user", async () => {
    const ok = await isOrphanGhostMergeable("ghost-9", "user-1", {
      snaptaxGhostAccount: {
        findUnique: async () => ({ userId: "user-1" }),
      },
    });
    assert.equal(ok, true);
  });
});

describe("listHistoricalGhostIdsForUser", () => {
  it("returns non-empty historical ghost ids from user receipts", async () => {
    const result = await listHistoricalGhostIdsForUser("user-1", {
      snaptaxReceipt: {
        findMany: async ({ where, select, distinct }) => {
          assert.deepEqual(where, { userId: "user-1", ghostId: { not: null } });
          assert.deepEqual(select, { ghostId: true });
          assert.deepEqual(distinct, ["ghostId"]);
          return [
            { ghostId: "ghost-old" },
            { ghostId: null },
            { ghostId: "" },
            { ghostId: "ghost-client" },
          ];
        },
      },
    });

    assert.deepEqual(result, ["ghost-old", "ghost-client"]);
  });
});

describe("mergeOrphanGhostData", () => {
  it("merges receipts and event store per ghost", async () => {
    const order: string[] = [];

    const result = await mergeOrphanGhostData("user-1", ["ghost-old", "ghost-old"], {
      snaptaxGhostAccount: {
        findUnique: async () => null,
      },
      snaptaxReceipt: {
        updateMany: async () => {
          order.push("receipts");
          return { count: 2 };
        },
      },
      snaptaxReceiptEvent: {
        updateMany: async () => ({ count: 1 }),
      },
      snaptaxReceiptLifecycleSnapshot: {
        updateMany: async () => ({ count: 0 }),
      },
      snaptaxReceiptSyncCursor: {
        findUnique: async ({ where }) =>
          "ghostId" in where && where.ghostId === "ghost-old"
            ? {
                lastEventId: "evt-1",
                lastClientCreatedAt: new Date(1),
              }
            : null,
        upsert: async () => {
          order.push("cursor");
          return {};
        },
        deleteMany: async () => ({ count: 0 }),
      },
    });

    assert.deepEqual(order, ["receipts", "cursor"]);
    assert.deepEqual(result.mergedGhostIds, ["ghost-old"]);
    assert.equal(result.totalReceipts, 2);
    assert.equal(result.merged[0]?.receipts, 2);
  });

  it("skips ghosts bound to another user", async () => {
    const result = await mergeOrphanGhostData("user-1", ["ghost-other"], {
      snaptaxGhostAccount: {
        findUnique: async () => ({ userId: "user-2" }),
      },
      snaptaxReceipt: {
        updateMany: async () => {
          throw new Error("should not update");
        },
      },
      snaptaxReceiptEvent: {
        updateMany: async () => ({ count: 0 }),
      },
      snaptaxReceiptLifecycleSnapshot: {
        updateMany: async () => ({ count: 0 }),
      },
      snaptaxReceiptSyncCursor: {
        findUnique: async () => null,
        upsert: async () => ({}),
        deleteMany: async () => ({ count: 0 }),
      },
    });

    assert.deepEqual(result, {
      merged: [],
      mergedGhostIds: [],
      totalReceipts: 0,
    });
  });

  it("counts event-only migrations as merged ghosts", async () => {
    const result = await mergeOrphanGhostData("user-1", ["ghost-events"], {
      snaptaxGhostAccount: {
        findUnique: async () => null,
      },
      snaptaxReceipt: {
        updateMany: async () => ({ count: 0 }),
      },
      snaptaxReceiptEvent: {
        updateMany: async ({ where, data }) => {
          assert.deepEqual(where, { ghostId: "ghost-events", userId: null });
          assert.deepEqual(data, { userId: "user-1" });
          return { count: 2 };
        },
      },
      snaptaxReceiptLifecycleSnapshot: {
        updateMany: async () => ({ count: 1 }),
      },
      snaptaxReceiptSyncCursor: {
        findUnique: async () => null,
        upsert: async () => ({}),
        deleteMany: async () => ({ count: 0 }),
      },
    });

    assert.deepEqual(result.mergedGhostIds, ["ghost-events"]);
    assert.equal(result.totalReceipts, 0);
    assert.deepEqual(result.merged, [
      {
        ghostId: "ghost-events",
        receipts: 0,
        events: 2,
        snapshots: 1,
        cursorMerged: false,
      },
    ]);
  });
});
