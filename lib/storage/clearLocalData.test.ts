import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { FOUNDER_WIDGET_SEEN_KEY } from "@/lib/founder/founderStorage";
import {
  clearLocalAppData,
  clearPendingLocalWipeFlag,
  hasPendingLocalWipe,
  markPendingLocalWipe,
  PENDING_LOCAL_WIPE_KEY,
} from "./clearLocalData.ts";

type MemoryStore = Map<string, string>;

function installMemoryStorage(name: "localStorage" | "sessionStorage"): MemoryStore {
  const store: MemoryStore = new Map();
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: {
      get length() {
        return store.size;
      },
      key(index: number) {
        return [...store.keys()][index] ?? null;
      },
      getItem(key: string) {
        return store.has(key) ? store.get(key)! : null;
      },
      setItem(key: string, value: string) {
        store.set(key, String(value));
      },
      removeItem(key: string) {
        store.delete(key);
      },
      clear() {
        store.clear();
      },
    },
  });
  return store;
}

describe("clearLocalAppData web storage", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "localStorage");
    Reflect.deleteProperty(globalThis, "sessionStorage");
    Reflect.deleteProperty(globalThis, "caches");
  });

  it("clears snap1099_* local+session keys, founder key, and caches", async () => {
    const local = installMemoryStorage("localStorage");
    const session = installMemoryStorage("sessionStorage");
    const deletedCaches: string[] = [];

    local.set("snap1099_ghost_id", "g1");
    local.set("snap1099_known_ghost_ids", '["g0"]');
    local.set(FOUNDER_WIDGET_SEEN_KEY, "1");
    local.set("other_key", "keep");
    session.set("snap1099_landing_done", "1");
    session.set("other_session", "keep");
    markPendingLocalWipe();

    Object.defineProperty(globalThis, "caches", {
      configurable: true,
      value: {
        keys: async () => ["serwist-precache", "runtime"],
        delete: async (key: string) => {
          deletedCaches.push(key);
          return true;
        },
      },
    });

    await clearLocalAppData();

    assert.equal(local.has("snap1099_ghost_id"), false);
    assert.equal(local.has("snap1099_known_ghost_ids"), false);
    assert.equal(local.has(FOUNDER_WIDGET_SEEN_KEY), false);
    assert.equal(local.has(PENDING_LOCAL_WIPE_KEY), false);
    assert.equal(local.get("other_key"), "keep");
    assert.equal(session.has("snap1099_landing_done"), false);
    assert.equal(session.get("other_session"), "keep");
    assert.deepEqual(deletedCaches.sort(), ["runtime", "serwist-precache"]);
    assert.equal(hasPendingLocalWipe(), false);
  });

  it("tracks pending wipe flag independently", () => {
    installMemoryStorage("localStorage");
    assert.equal(hasPendingLocalWipe(), false);
    markPendingLocalWipe();
    assert.equal(hasPendingLocalWipe(), true);
    clearPendingLocalWipeFlag();
    assert.equal(hasPendingLocalWipe(), false);
  });
});
