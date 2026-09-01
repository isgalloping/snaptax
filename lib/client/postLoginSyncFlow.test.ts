import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runPostLoginSync } from "@/lib/client/postLoginSyncFlow";
import type { StoredReceipt } from "@/lib/storage/receiptDb";
import type { Receipt } from "@/lib/types";

const LOCAL_ROW: StoredReceipt = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  status: "processing",
  timestamp: new Date("2026-06-14T12:00:00.000Z"),
  pendingUpload: false,
};

const MERGED_ROW: Receipt = {
  ...LOCAL_ROW,
  status: "done",
  merchant: "Depot",
  amount: 42,
};

function deps(overrides: Partial<Parameters<typeof runPostLoginSync>[1]> = {}) {
  return {
    isOnline: () => true,
    ensureGhostSession: async () => {},
    mergeOrphanGhostsOnLogin: async () => {},
    flushPendingUploads: async () => {},
    flushPendingDeletes: async () => {},
    flushReceiptEventBatch: async () => {},
    loadAllReceipts: async () => [LOCAL_ROW],
    syncFromServer: async () => [MERGED_ROW],
    pollTaxRecalc: async () => {},
    ...overrides,
  };
}

describe("runPostLoginSync", () => {
  it("runs login sync side effects in order and keeps event batch best-effort", async () => {
    const order: string[] = [];
    let initialMerge: Receipt[] | null = null;

    const result = await runPostLoginSync(
      0,
      deps({
        ensureGhostSession: async () => {
          order.push("ghost");
        },
        mergeOrphanGhostsOnLogin: async () => {
          order.push("orphans");
        },
        flushPendingUploads: async () => {
          order.push("uploads");
        },
        flushPendingDeletes: async () => {
          order.push("deletes");
        },
        flushReceiptEventBatch: async (opts) => {
          order.push(`events:${String(opts.force)}`);
          throw new Error("EVENT_SYNC_DOWN");
        },
        loadAllReceipts: async () => {
          order.push("load");
          return [LOCAL_ROW];
        },
        syncFromServer: async (local, mode, opts) => {
          order.push(`sync:${mode}:${String(opts?.requireComplete)}`);
          assert.deepEqual(local, [LOCAL_ROW]);
          return [MERGED_ROW];
        },
        onInitialMerge: (merged) => {
          order.push("initial-merge");
          initialMerge = merged;
        },
      }),
    );

    assert.deepEqual(order, [
      "ghost",
      "orphans",
      "uploads",
      "deletes",
      "events:true",
      "load",
      "sync:immediate:true",
      "initial-merge",
    ]);
    assert.deepEqual(initialMerge, [MERGED_ROW]);
    assert.deepEqual(result.initialMerged, [MERGED_ROW]);
  });

  it("fails before side effects when a complete sync is required offline", async () => {
    const order: string[] = [];

    await assert.rejects(
      () =>
        runPostLoginSync(
          0,
          deps({
            isOnline: () => false,
            ensureGhostSession: async () => {
              order.push("ghost");
            },
          }),
        ),
      /FETCH_RECEIPT_SYNC_FAILED/,
    );
    assert.deepEqual(order, []);
  });

  it("normalizes ghost session failures to complete-sync failure", async () => {
    await assert.rejects(
      () =>
        runPostLoginSync(
          0,
          deps({
            ensureGhostSession: async () => {
              throw new Error("REGISTER_FAILED");
            },
          }),
        ),
      /FETCH_RECEIPT_SYNC_FAILED/,
    );
  });

  it("performs complete sync on each tax recalc poll tick", async () => {
    const order: string[] = [];
    const TICK_ROW: StoredReceipt = {
      ...LOCAL_ROW,
      id: "550e8400-e29b-41d4-a716-446655440001",
    };

    await runPostLoginSync(
      2,
      deps({
        loadAllReceipts: async () => {
          order.push("load");
          return order.filter((item) => item === "load").length === 1
            ? [LOCAL_ROW]
            : [TICK_ROW];
        },
        syncFromServer: async (local, mode, opts) => {
          order.push(
            `sync:${local[0]?.id}:${mode}:${String(opts?.requireComplete)}`,
          );
          return [MERGED_ROW];
        },
        pollTaxRecalc: async (queued, tick) => {
          order.push(`poll:${queued}`);
          await tick();
          await tick();
        },
      }),
    );

    assert.deepEqual(order, [
      "load",
      `sync:${LOCAL_ROW.id}:immediate:true`,
      "poll:2",
      "load",
      `sync:${TICK_ROW.id}:immediate:true`,
      "load",
      `sync:${TICK_ROW.id}:immediate:true`,
    ]);
  });
});
