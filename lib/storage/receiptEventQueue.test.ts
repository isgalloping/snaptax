import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  RECEIPT_EVENT_RETENTION_MS,
  appendReceiptEvent,
  listPendingReceiptEvents,
  markReceiptEventsSynced,
  shouldPruneSyncedReceiptEvent,
} from "@/lib/storage/receiptEventQueue";
import { clearAllLocalData } from "@/lib/storage/receiptDb";
import type { StoredReceiptEvent } from "@/lib/storage/receiptEventTypes";

describe("receiptEventQueue", () => {
  beforeEach(async () => {
    await clearAllLocalData();
  });

  it("lists pending events oldest first and honors the batch limit", async () => {
    const newer = await appendReceiptEvent({
      receiptId: "00000000-0000-0000-0000-000000000001",
      type: "RECEIPT_CREATED",
      payload: { pendingUpload: true },
      createdAtMs: 1_700_000_000_200,
    });
    const older = await appendReceiptEvent({
      receiptId: "00000000-0000-0000-0000-000000000002",
      type: "OCR_COMPLETED",
      payload: { source: "local_ocr" },
      createdAtMs: 1_700_000_000_100,
    });

    const firstBatch = await listPendingReceiptEvents(1);
    assert.deepEqual(
      firstBatch.map((event) => event.id),
      [older.id],
    );

    const allPending = await listPendingReceiptEvents();
    assert.deepEqual(
      allPending.map((event) => event.id),
      [older.id, newer.id],
    );
    assert.equal(allPending[0]?.syncStatus, "pending");
    assert.deepEqual(allPending[0]?.payload, { source: "local_ocr" });
  });

  it("marks only acknowledged events as synced", async () => {
    const acknowledged = await appendReceiptEvent({
      receiptId: "00000000-0000-0000-0000-000000000003",
      type: "TAX_CALCULATED",
      payload: { taxAmount: 12.34 },
      createdAtMs: 1_700_000_000_300,
    });
    const retryLater = await appendReceiptEvent({
      receiptId: "00000000-0000-0000-0000-000000000004",
      type: "RECEIPT_CREATED",
      createdAtMs: 1_700_000_000_400,
    });

    await markReceiptEventsSynced([acknowledged.id]);
    await markReceiptEventsSynced([]);
    await markReceiptEventsSynced(["missing-event"]);

    const pending = await listPendingReceiptEvents();
    assert.deepEqual(
      pending.map((event) => event.id),
      [retryLater.id],
    );
    assert.deepEqual(pending[0]?.payload, {});
  });

  it("shouldPruneSyncedReceiptEvent keeps recent synced rows", () => {
    const cutoffMs = 1_700_000_000_000;
    const recent: StoredReceiptEvent = {
      id: "00000000-0000-0000-0000-000000000001",
      receiptId: "00000000-0000-0000-0000-000000000010",
      type: "OCR_COMPLETED",
      payload: {},
      createdAtMs: cutoffMs,
      syncStatus: "synced",
      syncedAtMs: cutoffMs,
    };
    assert.equal(shouldPruneSyncedReceiptEvent(recent, cutoffMs), false);
  });

  it("shouldPruneSyncedReceiptEvent prunes stale synced rows", () => {
    const cutoffMs = 1_700_000_000_000;
    const stale: StoredReceiptEvent = {
      id: "00000000-0000-0000-0000-000000000002",
      receiptId: "00000000-0000-0000-0000-000000000011",
      type: "TAX_CALCULATED",
      payload: {},
      createdAtMs: cutoffMs - 100_000,
      syncStatus: "synced",
      syncedAtMs: cutoffMs - 100_000,
    };
    assert.equal(shouldPruneSyncedReceiptEvent(stale, cutoffMs), true);
  });

  it("RECEIPT_EVENT_RETENTION_MS aligns with 90-day photo retention", () => {
    assert.equal(RECEIPT_EVENT_RETENTION_MS, 90 * 24 * 60 * 60 * 1000);
  });

  it("shouldPruneSyncedReceiptEvent ignores pending rows", () => {
    const cutoffMs = 1_700_000_000_000;
    const pending: StoredReceiptEvent = {
      id: "00000000-0000-0000-0000-000000000003",
      receiptId: "00000000-0000-0000-0000-000000000012",
      type: "RECEIPT_CREATED",
      payload: {},
      createdAtMs: cutoffMs - 100_000,
      syncStatus: "pending",
    };
    assert.equal(shouldPruneSyncedReceiptEvent(pending, cutoffMs), false);
  });
});
