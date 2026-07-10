import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { migrateEventStoreOnGhostBind } from "@/lib/server/migrateEventStoreOnGhostBind";

describe("migrateEventStoreOnGhostBind", () => {
  it("reassigns ghost events/snapshots and merges cursor onto user", async () => {
    const upserts: Array<{ userId: string; lastEventId: string }> = [];
    const deletedGhostCursors: string[] = [];

    const result = await migrateEventStoreOnGhostBind(
      "user-1",
      "ghost-9",
      {
        snaptaxReceiptEvent: {
          updateMany: async ({ where, data }) => {
            assert.deepEqual(where, { ghostId: "ghost-9", userId: null });
            assert.deepEqual(data, { userId: "user-1" });
            return { count: 2 };
          },
        },
        snaptaxReceiptLifecycleSnapshot: {
          updateMany: async ({ where, data }) => {
            assert.deepEqual(where, { ghostId: "ghost-9", userId: null });
            assert.deepEqual(data, { userId: "user-1" });
            return { count: 1 };
          },
        },
        snaptaxReceiptSyncCursor: {
          findUnique: async ({ where }) => {
            if ("ghostId" in where && where.ghostId === "ghost-9") {
              return {
                ghostId: "ghost-9",
                lastEventId: "00000000-0000-0000-0000-000000000020",
                lastClientCreatedAt: new Date("2026-07-01T00:00:00.000Z"),
              };
            }
            if ("userId" in where && where.userId === "user-1") {
              return {
                userId: "user-1",
                lastEventId: "00000000-0000-0000-0000-000000000010",
                lastClientCreatedAt: new Date("2026-06-01T00:00:00.000Z"),
              };
            }
            return null;
          },
          upsert: async ({ create, update }) => {
            upserts.push({
              userId: create.userId,
              lastEventId: update.lastEventId,
            });
            return {};
          },
          deleteMany: async ({ where }) => {
            if ("ghostId" in where) deletedGhostCursors.push(where.ghostId as string);
            return { count: 1 };
          },
        },
      },
    );

    assert.deepEqual(result, { events: 2, snapshots: 1, cursorMerged: true });
    assert.equal(upserts.length, 1);
    assert.equal(
      upserts[0]?.lastEventId,
      "00000000-0000-0000-0000-000000000020",
    );
    assert.deepEqual(deletedGhostCursors, ["ghost-9"]);
  });

  it("skips cursor upsert when user cursor is already ahead", async () => {
    let upsertCalls = 0;

    const result = await migrateEventStoreOnGhostBind(
      "user-ahead",
      "ghost-old",
      {
        snaptaxReceiptEvent: {
          updateMany: async () => ({ count: 0 }),
        },
        snaptaxReceiptLifecycleSnapshot: {
          updateMany: async () => ({ count: 0 }),
        },
        snaptaxReceiptSyncCursor: {
          findUnique: async ({ where }) => {
            if ("ghostId" in where) {
              return {
                ghostId: "ghost-old",
                lastEventId: "00000000-0000-0000-0000-000000000001",
                lastClientCreatedAt: new Date("2026-01-01T00:00:00.000Z"),
              };
            }
            return {
              userId: "user-ahead",
              lastEventId: "00000000-0000-0000-0000-000000000099",
              lastClientCreatedAt: new Date("2026-07-01T00:00:00.000Z"),
            };
          },
          upsert: async () => {
            upsertCalls += 1;
            return {};
          },
          deleteMany: async () => ({ count: 1 }),
        },
      },
    );

    assert.equal(result.cursorMerged, false);
    assert.equal(upsertCalls, 0);
  });

  it("is idempotent when ghost rows already belong to user", async () => {
    let eventUpdates = 0;

    const result = await migrateEventStoreOnGhostBind(
      "user-1",
      "ghost-9",
      {
        snaptaxReceiptEvent: {
          updateMany: async () => {
            eventUpdates += 1;
            return { count: 0 };
          },
        },
        snaptaxReceiptLifecycleSnapshot: {
          updateMany: async () => ({ count: 0 }),
        },
        snaptaxReceiptSyncCursor: {
          findUnique: async () => null,
          upsert: async () => ({}),
          deleteMany: async () => ({ count: 0 }),
        },
      },
    );

    assert.deepEqual(result, { events: 0, snapshots: 0, cursorMerged: false });
    assert.equal(eventUpdates, 1);
  });
});
