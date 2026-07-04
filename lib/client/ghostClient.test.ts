import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  ensureGhostSession,
  resetGhostSessionFlightForTests,
} from "./ghostClient.ts";

describe("ensureGhostSession", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetGhostSessionFlightForTests();
  });

  it("shares one in-flight ghost/register POST across concurrent callers", async () => {
    let postCount = 0;
    let resolveRegister: (() => void) | undefined;

    globalThis.fetch = (async () => {
      postCount += 1;
      await new Promise<void>((resolve) => {
        resolveRegister = resolve;
      });
      return new Response(JSON.stringify({ ghostId: "ghost-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const first = ensureGhostSession();
    const second = ensureGhostSession();
    assert.equal(postCount, 1);

    resolveRegister?.();
    const [a, b] = await Promise.all([first, second]);
    assert.equal(a, "ghost-1");
    assert.equal(b, "ghost-1");
    assert.equal(postCount, 1);
  });
});
