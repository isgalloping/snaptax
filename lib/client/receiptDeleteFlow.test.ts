import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deleteReceiptLocalAndRemote,
  flushPendingDeletes,
  pruneLocalSyncedAbsentFromRemote,
} from "./receiptDeleteFlow.ts";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

const LOCAL_UUID = "550e8400-e29b-41d4-a716-446655440000";
const REMOTE_ONLY_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

function localRow(id: string, pendingUpload = false): StoredReceipt {
  return {
    id,
    status: "done",
    timestamp: new Date("2026-06-14T12:00:00.000Z"),
    pendingUpload,
  };
}

describe("deleteReceiptLocalAndRemote", () => {
  it("tombstones persisted ids before local delete", async () => {
    const order: string[] = [];

    await deleteReceiptLocalAndRemote(LOCAL_UUID, {
      isOnline: () => false,
      addTombstone: async () => {
        order.push("tombstone");
      },
      deleteLocal: async () => {
        order.push("local");
      },
      deleteRemote: async () => {
        order.push("remote");
      },
    });

    assert.deepEqual(order, ["tombstone", "local"]);
  });

  it("clears tombstone after successful remote delete", async () => {
    let tombstoned = true;
    let removed = false;

    await deleteReceiptLocalAndRemote(LOCAL_UUID, {
      isOnline: () => true,
      ensureGhostSession: async () => {},
      addTombstone: async () => {
        tombstoned = true;
      },
      removeTombstone: async () => {
        removed = true;
      },
      deleteLocal: async () => {},
      deleteRemote: async () => {},
    });

    assert.equal(tombstoned, true);
    assert.equal(removed, true);
  });
});

describe("flushPendingDeletes", () => {
  it("retries remote delete for tombstoned ids", async () => {
    const deleted: string[] = [];
    const removed: string[] = [];

    await flushPendingDeletes({
      isOnline: () => true,
      ensureGhostSession: async () => {},
      readTombstones: async () => new Set([LOCAL_UUID]),
      deleteRemote: async (id) => {
        deleted.push(id);
      },
      removeTombstone: async (id) => {
        removed.push(id);
      },
    });

    assert.deepEqual(deleted, [LOCAL_UUID]);
    assert.deepEqual(removed, [LOCAL_UUID]);
  });
});

describe("pruneLocalSyncedAbsentFromRemote", () => {
  it("removes synced local rows missing from remote when signed-in prune runs", async () => {
    const removed: string[] = [];
    const local = [
      localRow(LOCAL_UUID),
      localRow(REMOTE_ONLY_UUID),
      localRow("local-only", true),
    ];
    const remoteIds = new Set([LOCAL_UUID]);

    await pruneLocalSyncedAbsentFromRemote(local, remoteIds, async (id) => {
      removed.push(id);
    });

    assert.deepEqual(removed, [REMOTE_ONLY_UUID]);
  });
});
