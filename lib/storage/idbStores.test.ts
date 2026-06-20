import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  IDB_DB_NAME,
  IDB_LEGACY_DB_NAME,
} from "@/lib/storage/idbStores";

describe("idbStores", () => {
  it("uses snaptax as IndexedDB database name", () => {
    assert.equal(IDB_DB_NAME, "snaptax");
    assert.equal(IDB_LEGACY_DB_NAME, "snap1099");
  });
});
