import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signGhostToken } from "@/lib/auth/ghostToken";
import { verifyClientOrphanGhostPossession } from "@/lib/server/verifyClientOrphanGhostPossession";

describe("verifyClientOrphanGhostPossession", () => {
  it("accepts tokens that verify and match ghostId", () => {
    process.env.GHOST_HMAC_SECRET = "test-secret-min-32-chars-long!!";
    const { token, ghostId } = signGhostToken();
    assert.deepEqual(
      verifyClientOrphanGhostPossession([{ ghostId, token }]),
      [ghostId],
    );
  });

  it("rejects mismatched ghostId even with valid HMAC", () => {
    process.env.GHOST_HMAC_SECRET = "test-secret-min-32-chars-long!!";
    const { token } = signGhostToken("ghost-real");
    assert.deepEqual(
      verifyClientOrphanGhostPossession([
        { ghostId: "ghost-spoofed", token },
      ]),
      [],
    );
  });

  it("rejects tampered tokens", () => {
    process.env.GHOST_HMAC_SECRET = "test-secret-min-32-chars-long!!";
    const { token, ghostId } = signGhostToken();
    assert.deepEqual(
      verifyClientOrphanGhostPossession([
        { ghostId, token: `${token.slice(0, -2)}xx` },
      ]),
      [],
    );
  });
});
