import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  IDB_DB_NAME,
  IDB_DB_VERSION,
  IDB_LEGACY_DB_NAME,
  IDB_STORE_RECEIPT_SUMMARY,
} from "@/lib/storage/idbStores";

describe("idbStores", () => {
  it("uses snaptax as IndexedDB database name", () => {
    assert.equal(IDB_DB_NAME, "snaptax");
    assert.equal(IDB_LEGACY_DB_NAME, "snap1099");
  });

  it("uses v7 receipt summary store constants", () => {
    assert.equal(IDB_DB_VERSION, 7);
    assert.equal(IDB_STORE_RECEIPT_SUMMARY, "snaptax_receipts_summary");
  });
});
