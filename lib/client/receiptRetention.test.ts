import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  pruneReceiptsOlderThanRetention,
  receiptRetentionCutoff,
  shouldPruneReceipt,
} from "@/lib/client/receiptRetention";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

function receipt(
  overrides: Partial<StoredReceipt> & Pick<StoredReceipt, "id" | "timestamp">,
): StoredReceipt {
  return {
    status: "done",
    ...overrides,
  };
}

describe("shouldPruneReceipt", () => {
  it("skips pendingUpload receipts even when older than cutoff", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    const cutoff = receiptRetentionCutoff(now);
    assert.equal(
      shouldPruneReceipt(
        receipt({
          id: "old-pending",
          timestamp: new Date("2020-01-01T00:00:00.000Z"),
          pendingUpload: true,
        }),
        cutoff,
      ),
      false,
    );
  });

  it("prunes synced receipts older than cutoff", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    const cutoff = receiptRetentionCutoff(now);
    assert.equal(
      shouldPruneReceipt(
        receipt({
          id: "old-done",
          timestamp: new Date("2020-01-01T00:00:00.000Z"),
        }),
        cutoff,
      ),
      true,
    );
    assert.equal(
      shouldPruneReceipt(
        receipt({
          id: "recent",
          timestamp: new Date("2026-05-01T00:00:00.000Z"),
        }),
        cutoff,
      ),
      false,
    );
  });
});

describe("pruneReceiptsOlderThanRetention", () => {
  it("keeps pendingUpload and deletes only stale synced rows", async () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    const deleted: string[] = [];

    const pruned = await pruneReceiptsOlderThanRetention(now, {
      loadAllReceipts: async () => [
        receipt({
          id: "keep-pending",
          timestamp: new Date("2020-01-01T00:00:00.000Z"),
          pendingUpload: true,
        }),
        receipt({
          id: "delete-me",
          timestamp: new Date("2020-01-01T00:00:00.000Z"),
        }),
        receipt({
          id: "keep-recent",
          timestamp: new Date("2026-05-15T00:00:00.000Z"),
        }),
      ],
      deleteReceipt: async (id) => {
        deleted.push(id);
      },
    });

    assert.equal(pruned, 1);
    assert.deepEqual(deleted, ["delete-me"]);
  });
});
