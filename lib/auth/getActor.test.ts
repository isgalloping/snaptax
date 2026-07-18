import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { signGhostToken, GHOST_COOKIE_NAME } from "./ghostToken.ts";
import { getActor, type GetActorDeps } from "./getActor.ts";

const SECRET = "test-ghost-hmac-secret-min-32-chars!!";

describe("getActor", () => {
  const prevSecret = process.env.GHOST_HMAC_SECRET;

  beforeEach(() => {
    process.env.GHOST_HMAC_SECRET = SECRET;
  });

  afterEach(() => {
    process.env.GHOST_HMAC_SECRET = prevSecret;
  });

  function requestWithCookie(cookie: string): Request {
    return new Request("https://example.com/api/ghost/data", {
      headers: { cookie },
    });
  }

  it("does not hard-fail on invalid ghost cookie when session user exists", async () => {
    const deps: GetActorDeps = {
      getSession: async () => ({
        userId: "user-1",
        email: "a@example.com",
      }),
      findUserId: async (id) => (id === "user-1" ? id : null),
      findGhostBinding: async () => null,
    };
    const actor = await getActor(
      requestWithCookie(`${GHOST_COOKIE_NAME}=tampered.token.value`),
      {},
      deps,
    );
    assert.equal(actor.kind, "user");
    if (actor.kind === "user") {
      assert.equal(actor.userId, "user-1");
      assert.equal(actor.ghostId, undefined);
    }
  });

  it("falls through to ghost when session JWT exists but user row is gone", async () => {
    const { token, ghostId } = signGhostToken("ghost-alive");
    const deps: GetActorDeps = {
      getSession: async () => ({
        userId: "deleted-user",
        email: "gone@example.com",
      }),
      findUserId: async () => null,
      findGhostBinding: async () => null,
    };
    const actor = await getActor(
      requestWithCookie(`${GHOST_COOKIE_NAME}=${token}`),
      {},
      deps,
    );
    assert.deepEqual(actor, {
      kind: "ghost",
      ghostId,
      bound: false,
    });
  });

  it("returns user when session matches an existing user row", async () => {
    const { token, ghostId } = signGhostToken("ghost-bound");
    const deps: GetActorDeps = {
      getSession: async () => ({
        userId: "user-1",
        email: "a@example.com",
      }),
      findUserId: async (id) => (id === "user-1" ? id : null),
      findGhostBinding: async () => null,
    };
    const actor = await getActor(
      requestWithCookie(`${GHOST_COOKIE_NAME}=${token}`),
      {},
      deps,
    );
    assert.deepEqual(actor, {
      kind: "user",
      userId: "user-1",
      ghostId,
      email: "a@example.com",
    });
  });
});
