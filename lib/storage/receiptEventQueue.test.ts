import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RECEIPT_EVENT_RETENTION_MS,
  appendReceiptEvent,
  listPendingReceiptEvents,
  markReceiptEventsSynced,
  shouldPruneSyncedReceiptEvent,
} from "@/lib/storage/receiptEventQueue";
import type { StoredReceiptEvent } from "@/lib/storage/receiptEventTypes";

describe("receiptEventQueue", () => {
  it("exports append/list/mark helpers", () => {
    assert.equal(typeof appendReceiptEvent, "function");
    assert.equal(typeof listPendingReceiptEvents, "function");
    assert.equal(typeof markReceiptEventsSynced, "function");
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
