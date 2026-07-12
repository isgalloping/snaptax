import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  ensureGhostSession,
  getClientOrphanGhostIds,
  rememberKnownGhostId,
  resetGhostSessionFlightForTests,
} from "./ghostClient.ts";

describe("ghost known ids", () => {
  const storage = new Map<string, string>();

  afterEach(() => {
    storage.clear();
    resetGhostSessionFlightForTests();
  });

  beforeEach(() => {
    globalThis.localStorage = {
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
    } as Storage;
  });

  it("tracks rotated ghost ids for orphan merge", () => {
    storage.set("snap1099_ghost_id", "ghost-old");
    rememberKnownGhostId("ghost-old");
    rememberKnownGhostId("ghost-new");
    assert.deepEqual(getClientOrphanGhostIds("ghost-new"), ["ghost-old"]);
  });
});

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
