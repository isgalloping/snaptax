import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceReceiptSyncCursor,
  shouldAdvanceReceiptSyncCursor,
} from "@/lib/server/receiptSyncCursor";
import { receiptEventServerRetentionCutoff } from "@/lib/server/pruneReceiptEvents";

describe("receiptSyncCursor", () => {
  it("advanceReceiptSyncCursor picks latest clientCreatedAtMs", () => {
    const next = advanceReceiptSyncCursor(null, [
      { id: "00000000-0000-0000-0000-000000000001", clientCreatedAtMs: 100 },
      { id: "00000000-0000-0000-0000-000000000002", clientCreatedAtMs: 200 },
    ]);
    assert.deepEqual(next, {
      lastEventId: "00000000-0000-0000-0000-000000000002",
      lastClientCreatedAtMs: 200,
    });
  });

  it("advanceReceiptSyncCursor breaks ties by event id", () => {
    const next = advanceReceiptSyncCursor(null, [
      { id: "00000000-0000-0000-0000-000000000001", clientCreatedAtMs: 100 },
      { id: "00000000-0000-0000-0000-000000000002", clientCreatedAtMs: 100 },
    ]);
    assert.equal(next?.lastEventId, "00000000-0000-0000-0000-000000000002");
  });

  it("shouldAdvanceReceiptSyncCursor rejects stale cursors", () => {
    const current = {
      lastEventId: "00000000-0000-0000-0000-000000000010",
      lastClientCreatedAtMs: 500,
    };
    assert.equal(
      shouldAdvanceReceiptSyncCursor(current, {
        lastEventId: "00000000-0000-0000-0000-000000000011",
        lastClientCreatedAtMs: 400,
      }),
      false,
    );
    assert.equal(
      shouldAdvanceReceiptSyncCursor(current, {
        lastEventId: "00000000-0000-0000-0000-000000000011",
        lastClientCreatedAtMs: 600,
      }),
      true,
    );
  });
});

describe("pruneReceiptEvents", () => {
  it("receiptEventServerRetentionCutoff uses 18 months", () => {
    const now = new Date("2026-07-10T12:00:00.000Z");
    const cutoff = receiptEventServerRetentionCutoff(now);
    assert.equal(cutoff.toISOString(), "2025-01-10T12:00:00.000Z");
  });
});
