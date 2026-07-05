import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import type { SnapNavKey } from "@/lib/client/appNavigationHistory";
import {
  consumeLegalReturnNav,
  dispatchLegalReturnNav,
  LEGAL_RETURN_EVENT,
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
    const listeners = new Map<string, Set<(event: Event) => void>>();
    (globalThis as { addEventListener?: typeof globalThis.addEventListener }).addEventListener =
      (type: string, listener: (event: Event) => void) => {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(listener);
      };
    (globalThis as { removeEventListener?: typeof globalThis.removeEventListener }).removeEventListener =
      (type: string, listener: (event: Event) => void) => {
        listeners.get(type)?.delete(listener);
      };
    (globalThis as { dispatchEvent?: typeof globalThis.dispatchEvent }).dispatchEvent =
      (event: Event) => {
        for (const listener of listeners.get(event.type) ?? []) {
          listener(event);
        }
        return true;
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

  it("dispatches legal return event with saved target", () => {
    const events: SnapNavKey[] = [];
    const handler = (event: Event) => {
      events.push((event as CustomEvent<SnapNavKey>).detail);
    };
    window.addEventListener(LEGAL_RETURN_EVENT, handler);
    try {
      const key = { kind: "settings", page: "privacy-center" } as const;
      dispatchLegalReturnNav(key);
      assert.deepEqual(events, [key]);
    } finally {
      window.removeEventListener(LEGAL_RETURN_EVENT, handler);
    }
  });
});
