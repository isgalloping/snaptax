import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSyncWhere,
  decodeSyncCursor,
  defaultSyncSince,
  encodeSyncCursor,
  parseSyncLimit,
} from "@/lib/receipts/syncQuery";

describe("syncQuery cursor", () => {
  it("round-trips updatedAt and id", () => {
    const c = encodeSyncCursor(new Date("2026-01-15T00:00:00.000Z"), "uuid");
    const d = decodeSyncCursor(c);
    assert.equal(d.id, "uuid");
    assert.equal(d.updatedAt.toISOString(), "2026-01-15T00:00:00.000Z");
  });

  it("rejects malformed cursors with INVALID_SYNC_CURSOR", () => {
    for (const cursor of [
      "!!!",
      Buffer.from(JSON.stringify({ id: "r1" }), "utf8").toString("base64url"),
      Buffer.from(JSON.stringify({ updatedAt: "2026-01-15T00:00:00.000Z" }), "utf8").toString(
        "base64url",
      ),
      Buffer.from(JSON.stringify({ updatedAt: "not-a-date", id: "r1" }), "utf8").toString(
        "base64url",
      ),
    ]) {
      assert.throws(() => decodeSyncCursor(cursor), /INVALID_SYNC_CURSOR/);
    }
  });
});

describe("syncQuery limit and window", () => {
  it("defaults and clamps sync limits", () => {
    assert.equal(parseSyncLimit(null), 50);
    assert.equal(parseSyncLimit("0"), 1);
    assert.equal(parseSyncLimit("-5"), 1);
    assert.equal(parseSyncLimit("1.9"), 1);
    assert.equal(parseSyncLimit("abc"), 50);
    assert.equal(parseSyncLimit("999", 100), 100);
  });

  it("defaults the sync window to eighteen months before now", () => {
    assert.equal(
      defaultSyncSince(new Date("2026-01-15T00:00:00.000Z")).toISOString(),
      "2024-07-15T00:00:00.000Z",
    );
  });
});

describe("syncQuery where builder", () => {
  it("scopes ghost syncs to unbound ghost receipts since the sync window", () => {
    const since = new Date("2024-07-15T00:00:00.000Z");

    assert.deepEqual(
      buildSyncWhere({ kind: "ghost", ghostId: "ghost-1", bound: false }, since),
      {
        ghostId: "ghost-1",
        userId: null,
        capturedAt: { gte: since },
      },
    );
  });

  it("adds cursor pagination to user syncs with updatedAt/id tie-break ordering", () => {
    const since = new Date("2024-07-15T00:00:00.000Z");
    const cursor = decodeSyncCursor(
      encodeSyncCursor(new Date("2026-01-15T12:00:00.000Z"), "receipt-9"),
    );

    assert.deepEqual(
      buildSyncWhere({ kind: "user", userId: "user-1", ghostId: "ghost-1" }, since, cursor),
      {
        userId: "user-1",
        capturedAt: { gte: since },
        OR: [
          { updatedAt: { lt: cursor.updatedAt } },
          { updatedAt: cursor.updatedAt, id: { lt: "receipt-9" } },
        ],
      },
    );
  });
});
