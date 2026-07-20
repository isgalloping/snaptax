import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PWA_APP_ENTRY } from "./pwaEntryRedirect.ts";

describe("openPwaAppEntry", () => {
  it("assigns full document navigation to the PWA entry", async () => {
    const assigned: string[] = [];
    const originalWindow = globalThis.window;

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        location: {
          assign: (url: string) => {
            assigned.push(url);
          },
        },
      },
    });

    try {
      const { openPwaAppEntry } = await import("./openPwaAppEntry.ts");
      openPwaAppEntry();
      assert.deepEqual(assigned, [PWA_APP_ENTRY]);
    } finally {
      if (originalWindow === undefined) {
        Reflect.deleteProperty(globalThis, "window");
      } else {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: originalWindow,
        });
      }
    }
  });
});
