import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { discoverOrphanGhostIds } from "@/lib/server/discoverOrphanGhostIds";
import { runOrphanGhostMergeForUser } from "@/lib/server/runOrphanGhostMergeForUser";

describe("runOrphanGhostMergeForUser", () => {
  it("merges discovered orphan ghosts for user", async () => {
    const result = await runOrphanGhostMergeForUser(
      {
        userId: "user-1",
        currentGhostId: "ghost-new",
        rebindPreviousGhostId: "ghost-old",
        clientOrphanGhostIds: ["ghost-client"],
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

    const expectedGhosts = discoverOrphanGhostIds({
      currentGhostId: "ghost-new",
      rebindPreviousGhostId: "ghost-old",
      historicalGhostIds: ["ghost-hist"],
      clientOrphanGhostIds: ["ghost-client"],
    });

    assert.deepEqual(result.mergedGhostIds.sort(), expectedGhosts.sort());
    assert.equal(result.totalReceipts, expectedGhosts.length);
  });
});
