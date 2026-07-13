import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  runOrphanGhostMergeForUser,
  type RunOrphanGhostMergeInput,
} from "@/lib/server/runOrphanGhostMergeForUser";

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
      },
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
          updateMany: async () => {
            throw new Error("client-only ghost should not update events");
          },
        },
        snaptaxReceiptLifecycleSnapshot: {
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
      },
    );

    assert.deepEqual(result, {
      merged: [],
      mergedGhostIds: [],
      totalReceipts: 0,
    });
  });
});
