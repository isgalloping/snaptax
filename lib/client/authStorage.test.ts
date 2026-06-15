import assert from "node:assert/strict";
import { afterEach, before, describe, it } from "node:test";
import { isSeasonPaid, setSeasonPaid } from "./authStorage.ts";

const SEASON = "2026";
const KEY = `snap1099_season_paid_${SEASON}`;
const storage = new Map<string, string>();

before(() => {
  Object.defineProperty(globalThis, "window", {
    value: globalThis,
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    configurable: true,
  });
});

describe("setSeasonPaid", () => {
  afterEach(() => {
    storage.delete(KEY);
  });

  it("clears localStorage when paid=false", () => {
    setSeasonPaid(SEASON, true);
    assert.equal(isSeasonPaid(SEASON), true);
    setSeasonPaid(SEASON, false);
    assert.equal(isSeasonPaid(SEASON), false);
    assert.equal(localStorage.getItem(KEY), null);
  });
});
