import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  hasSeasonExportDone,
  markSeasonExportDone,
  clearSeasonExportDone,
  seasonExportStorageKey,
} from "@/lib/settings/seasonExportState";

describe("seasonExportState", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    (globalThis as { localStorage?: Storage }).localStorage = {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => {
        storage.set(k, v);
      },
      removeItem: (k) => {
        storage.delete(k);
      },
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };
  });

  afterEach(() => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it("storage key is per season", () => {
    assert.equal(seasonExportStorageKey("2027"), "snap1099_tax_pack_exported_2027");
  });

  it("mark then has returns true", () => {
    markSeasonExportDone("2027");
    assert.equal(hasSeasonExportDone("2027"), true);
    assert.equal(hasSeasonExportDone("2028"), false);
  });

  it("clear removes flag", () => {
    markSeasonExportDone("2027");
    clearSeasonExportDone("2027");
    assert.equal(hasSeasonExportDone("2027"), false);
  });
});
