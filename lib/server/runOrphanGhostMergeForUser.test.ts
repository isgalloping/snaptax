import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  runOrphanGhostMergeForUser,
  type RunOrphanGhostMergeInput,
} from "@/lib/server/runOrphanGhostMergeForUser";
import type { OrphanGhostMergeDb } from "@/lib/server/mergeOrphanGhostData";

describe("runOrphanGhostMergeForUser", () => {
  it("merges discovered orphan ghosts for user", async () => {
    const result = await runOrphanGhostMergeForUser(
      {
        userId: "user-1",
        currentGhostId: "ghost-new",
        rebindPreviousGhostId: "ghost-old",
      },
      {
        snaptaxGhostAccount: {
          findUnique: async () => null,
        },
        snaptaxReceipt: {
          findMany: async () => [{ ghostId: "ghost-hist" }],
          updateMany: async () => ({ count: 1 }),
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
      } as unknown as OrphanGhostMergeDb,
    );

    const expectedGhosts = ["ghost-hist", "ghost-old"];

    assert.deepEqual(result.mergedGhostIds.sort(), expectedGhosts.sort());
    assert.equal(result.totalReceipts, expectedGhosts.length);
  });

  it("does not merge ghosts provided only by the client", async () => {
    const result = await runOrphanGhostMergeForUser(
      {
        userId: "user-1",
        currentGhostId: "ghost-new",
        clientOrphanGhostIds: ["ghost-client"],
      } as unknown as RunOrphanGhostMergeInput,
      {
        snaptaxGhostAccount: {
          findUnique: async () => {
            throw new Error("client-only ghost should not be checked");
          },
        },
        snaptaxReceipt: {
          findMany: async () => [],
          updateMany: async () => {
            throw new Error("client-only ghost should not update receipts");
          },
        },
        snaptaxReceiptEvent: {
          findMany: async () => [],
          updateMany: async () => {
            throw new Error("client-only ghost should not update events");
          },
        },
        snaptaxReceiptLifecycleSnapshot: {
          findMany: async () => [],
          updateMany: async () => {
            throw new Error("client-only ghost should not update snapshots");
          },
        },
        snaptaxReceiptSyncCursor: {
          findUnique: async () => {
            throw new Error("client-only ghost should not merge cursors");
          },
          upsert: async () => ({}),
          deleteMany: async () => ({ count: 0 }),
        },
      } as unknown as OrphanGhostMergeDb,
    );

    assert.deepEqual(result, {
      merged: [],
      mergedGhostIds: [],
      totalReceipts: 0,
    });
  });

  it("discovers historical ghosts from user-owned event store rows", async () => {
    const result = await runOrphanGhostMergeForUser(
      {
        userId: "user-1",
        currentGhostId: "ghost-new",
      },
      {
        snaptaxGhostAccount: {
          findUnique: async () => null,
        },
        snaptaxReceipt: {
          findMany: async () => [],
          updateMany: async ({ where }) => ({
            count: where.ghostId === "ghost-event" ? 1 : 0,
          }),
        },
        snaptaxReceiptEvent: {
          findMany: async () => [{ ghostId: "ghost-event" }],
          updateMany: async () => ({ count: 0 }),
        },
        snaptaxReceiptLifecycleSnapshot: {
          findMany: async () => [{ ghostId: "ghost-snapshot" }],
          updateMany: async () => ({ count: 1 }),
        },
        snaptaxReceiptSyncCursor: {
          findUnique: async () => null,
          upsert: async () => ({}),
          deleteMany: async () => ({ count: 0 }),
        },
      } as unknown as OrphanGhostMergeDb,
    );

    assert.deepEqual(result.mergedGhostIds.sort(), [
      "ghost-event",
      "ghost-snapshot",
    ]);
    assert.equal(result.totalReceipts, 1);
  });
});
