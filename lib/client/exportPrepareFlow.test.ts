import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { prepareExportSync, prepareExportLocal } from "./exportPrepareFlow.ts";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

const ROW: StoredReceipt = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  status: "done",
  timestamp: new Date("2026-06-14T12:00:00.000Z"),
};

describe("prepareExportSync", () => {
  it("throws EXPORT_OFFLINE when offline", async () => {
    await assert.rejects(
      () =>
        prepareExportSync({
          isOnline: () => false,
          flushPendingUploads: async () => {},
          flushPendingDeletes: async () => {},
          loadAllReceipts: async () => [],
          syncFromServer: async () => [],
          ensureGhostSession: async () => {},
        }),
      (err: Error) => err.message === "EXPORT_OFFLINE",
    );
  });

  it("flushes uploads then deletes then syncs in order", async () => {
    const order: string[] = [];

    const merged = await prepareExportSync({
      isOnline: () => true,
      ensureGhostSession: async () => {
        order.push("ghost");
      },
      flushPendingUploads: async () => {
        order.push("uploads");
      },
      flushPendingDeletes: async () => {
        order.push("deletes");
      },
      loadAllReceipts: async () => {
        order.push("load");
        return [ROW];
      },
      syncFromServer: async (local, mode) => {
        order.push(`sync:${mode}`);
        assert.equal(local.length, 1);
        return local;
      },
    });

    assert.deepEqual(order, [
      "ghost",
      "uploads",
      "deletes",
      "load",
      "sync:immediate",
    ]);
    assert.equal(merged.length, 1);
  });
});

describe("prepareExportLocal", () => {
  it("throws EXPORT_OFFLINE when offline", async () => {
    await assert.rejects(
      () =>
        prepareExportLocal({
          isOnline: () => false,
          flushPendingUploads: async () => {},
          flushPendingDeletes: async () => {},
          loadAllReceipts: async () => [],
          syncFromServer: async () => [],
          ensureGhostSession: async () => {},
        }),
      (err: Error) => err.message === "EXPORT_OFFLINE",
    );
  });

  it("flushes then loads IDB without server sync", async () => {
    const order: string[] = [];

    const local = await prepareExportLocal({
      isOnline: () => true,
      ensureGhostSession: async () => {
        order.push("ghost");
      },
      flushPendingUploads: async () => {
        order.push("uploads");
      },
      flushPendingDeletes: async () => {
        order.push("deletes");
      },
      loadAllReceipts: async () => {
        order.push("load");
        return [ROW];
      },
      syncFromServer: async () => {
        order.push("sync");
        return [];
      },
    });

    assert.deepEqual(order, ["ghost", "uploads", "deletes", "load"]);
    assert.equal(local.length, 1);
  });
});
