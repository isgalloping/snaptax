import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { pollTaxRecalc } from "./authApi.ts";

const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.setTimeout = originalSetTimeout;
});

describe("pollTaxRecalc", () => {
  it("awaits tick callbacks so complete sync failures propagate", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ receipts: [], taxSavedEstimate: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    globalThis.setTimeout = ((handler: TimerHandler) => {
      if (typeof handler === "function") handler();
      return 0;
    }) as typeof setTimeout;

    await assert.rejects(
      () =>
        pollTaxRecalc(1, async () => {
          throw new Error("COMPLETE_SYNC_FAILED");
        }),
      /COMPLETE_SYNC_FAILED/,
    );
  });
});
