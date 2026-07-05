import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  consumeLegalReturnNav,
  peekLegalReturnNav,
  saveLegalReturnNav,
} from "./legalReturnNav";

describe("legalReturnNav", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    (globalThis as { window?: typeof globalThis }).window = globalThis;
    (globalThis as { sessionStorage?: Storage }).sessionStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
      removeItem: (key) => {
        storage.delete(key);
      },
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };
  });

  afterEach(() => {
    delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
    delete (globalThis as { window?: typeof globalThis }).window;
  });

  it("saves and consumes settings privacy-center return target", () => {
    saveLegalReturnNav({ kind: "settings", page: "privacy-center" });
    assert.deepEqual(peekLegalReturnNav(), {
      kind: "settings",
      page: "privacy-center",
    });
    assert.deepEqual(consumeLegalReturnNav(), {
      kind: "settings",
      page: "privacy-center",
    });
    assert.equal(peekLegalReturnNav(), null);
  });
});
