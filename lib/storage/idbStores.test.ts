import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  IDB_DB_NAME,
  IDB_DB_VERSION,
  IDB_LEGACY_DB_NAME,
  IDB_STORE_RECEIPT_EVENTS,
  IDB_STORE_RECEIPT_SUMMARY,
} from "@/lib/storage/idbStores";

describe("idbStores", () => {
  it("uses snaptax as IndexedDB database name", () => {
    assert.equal(IDB_DB_NAME, "snaptax");
    assert.equal(IDB_LEGACY_DB_NAME, "snap1099");
  });

  it("uses v8 receipt events store constants", () => {
    assert.equal(IDB_DB_VERSION, 8);
    assert.equal(IDB_STORE_RECEIPT_SUMMARY, "snaptax_receipts_summary");
    assert.equal(IDB_STORE_RECEIPT_EVENTS, "snaptax_receipt_events");
  });
});
