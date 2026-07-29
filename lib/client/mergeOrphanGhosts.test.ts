import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { resetGhostSessionFlightForTests } from "./ghostClient.ts";
import { mergeOrphanGhostsOnLogin } from "./mergeOrphanGhosts.ts";

const originalFetch = globalThis.fetch;
const originalLocalStorage = globalThis.localStorage;
const originalNavigator = globalThis.navigator;

function installBrowserStubs(options: { online: boolean }) {
  const storage = new Map<string, string>();

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => storage.clear(),
      key: () => null,
      get length() {
        return storage.size;
      },
    } as Storage,
  });

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      ...originalNavigator,
      language: "en-US",
      languages: ["en-US"],
      onLine: options.online,
    },
  });

  return storage;
}

describe("mergeOrphanGhostsOnLogin", () => {
  afterEach(() => {
    resetGhostSessionFlightForTests();
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });

  it("posts HMAC-proven orphan ghosts after ensuring the current ghost session", async () => {
    const storage = installBrowserStubs({ online: true });
    storage.set("snap1099_ghost_id", "ghost-old");
    storage.set("snap1099_known_ghost_ids", JSON.stringify(["ghost-old"]));
    storage.set(
      "snap1099_known_ghost_tokens",
      JSON.stringify({ "ghost-old": "ghost-old.exp.sig" }),
    );

    const calls: Array<{ input: string; init?: RequestInit }> = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ input: url, init });

      if (url === "/api/ghost/register") {
        return new Response(
          JSON.stringify({
            ghostId: "ghost-current",
            ghostToken: "ghost-current.exp.sig",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (url === "/api/sync/ghost-orphans") {
        return new Response(
          JSON.stringify({ mergedGhostIds: ["ghost-old"], totalReceipts: 2 }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(`unexpected fetch ${url}`);
    }) as typeof fetch;

    const result = await mergeOrphanGhostsOnLogin();

    assert.deepEqual(result, {
      mergedGhostIds: ["ghost-old"],
      totalReceipts: 2,
    });
    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.input, "/api/ghost/register");
    assert.equal(calls[1]?.input, "/api/sync/ghost-orphans");
    assert.equal(calls[1]?.init?.method, "POST");
    assert.equal(calls[1]?.init?.credentials, "include");
    assert.equal(
      calls[1]?.init?.body,
      JSON.stringify({
        orphanGhosts: [{ ghostId: "ghost-old", token: "ghost-old.exp.sig" }],
      }),
    );
  });

  it("still posts merge with empty orphanGhosts when only current ghost is known", async () => {
    const storage = installBrowserStubs({ online: true });
    storage.set("snap1099_ghost_id", "ghost-current");
    storage.set("snap1099_known_ghost_ids", JSON.stringify(["ghost-current"]));
    storage.set(
      "snap1099_known_ghost_tokens",
      JSON.stringify({ "ghost-current": "tok" }),
    );

    const calls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(url);
      if (url === "/api/ghost/register") {
        return new Response(
          JSON.stringify({ ghostId: "ghost-current", ghostToken: "tok" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      if (url === "/api/sync/ghost-orphans") {
        assert.equal(init?.body, JSON.stringify({ orphanGhosts: [] }));
        return new Response(
          JSON.stringify({ mergedGhostIds: [], totalReceipts: 0 }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      throw new Error(`unexpected fetch ${url}`);
    }) as typeof fetch;

    const result = await mergeOrphanGhostsOnLogin();

    assert.deepEqual(result, { mergedGhostIds: [], totalReceipts: 0 });
    assert.deepEqual(calls, ["/api/ghost/register", "/api/sync/ghost-orphans"]);
  });

  it("does not create a ghost session or merge request while offline", async () => {
    installBrowserStubs({ online: false });
    let fetchCalled = false;
    globalThis.fetch = (async () => {
      fetchCalled = true;
      throw new Error("offline merge should not fetch");
    }) as typeof fetch;

    const result = await mergeOrphanGhostsOnLogin();

    assert.equal(result, null);
    assert.equal(fetchCalled, false);
  });
});
