import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signGhostToken } from "@/lib/auth/ghostToken";
import {
  deleteAccountBodySchema,
} from "./deleteAccountBody.ts";
import { verifyClientOrphanGhostPossession } from "@/lib/server/verifyClientOrphanGhostPossession";

describe("deleteAccountBodySchema", () => {
  it("defaults orphanGhosts to empty", () => {
    assert.deepEqual(deleteAccountBodySchema.parse({}).orphanGhosts, []);
  });

  it("accepts up to 20 possession entries", () => {
    const orphans = Array.from({ length: 20 }, (_, i) => ({
      ghostId: `g-${i}`,
      token: `t-${i}`,
    }));
    assert.equal(
      deleteAccountBodySchema.parse({ orphanGhosts: orphans }).orphanGhosts.length,
      20,
    );
  });

  it("rejects more than 20 orphan entries", () => {
    const orphans = Array.from({ length: 21 }, (_, i) => ({
      ghostId: `g-${i}`,
      token: `t-${i}`,
    }));
    assert.throws(() =>
      deleteAccountBodySchema.parse({ orphanGhosts: orphans }),
    );
  });

  it("verified parse path ignores bare / invalid tokens", () => {
    process.env.GHOST_HMAC_SECRET = "test-secret-min-32-chars-long!!";
    const { token, ghostId } = signGhostToken();
    const verified = verifyClientOrphanGhostPossession([
      { ghostId, token },
      { ghostId: "spoof", token },
      { ghostId: "bare", token: "not-a-token" },
    ]);
    assert.deepEqual(verified, [ghostId]);
  });
});
