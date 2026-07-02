import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  FOUNDER_WIDGET_SEEN_KEY,
  markFounderWidgetSeen,
  readFounderWidgetSeen,
} from "./founderStorage.ts";

describe("founderStorage", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
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

  afterEach(() => {
    storage.clear();
  });

  it("readFounderWidgetSeen returns false when unset", () => {
    assert.equal(readFounderWidgetSeen(), false);
  });

  it("markFounderWidgetSeen persists seen flag", () => {
    markFounderWidgetSeen();
    assert.equal(storage.get(FOUNDER_WIDGET_SEEN_KEY), "1");
    assert.equal(readFounderWidgetSeen(), true);
  });

  it("readFounderWidgetSeen returns false when window is undefined", () => {
    const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
    });
    try {
      assert.equal(readFounderWidgetSeen(), false);
    } finally {
      if (windowDescriptor) {
        Object.defineProperty(globalThis, "window", windowDescriptor);
      } else {
        delete (globalThis as { window?: unknown }).window;
      }
    }
  });
});
