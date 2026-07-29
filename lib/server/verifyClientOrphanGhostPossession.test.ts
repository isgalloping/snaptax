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

  it("dedupes valid proofs and ignores blank or invalid entries in a mixed batch", () => {
    process.env.GHOST_HMAC_SECRET = "test-secret-min-32-chars-long!!";
    const first = signGhostToken("ghost-first");
    const second = signGhostToken("ghost-second");
    const spoofed = signGhostToken("ghost-real");

    assert.deepEqual(
      verifyClientOrphanGhostPossession([
        { ghostId: first.ghostId, token: first.token },
        { ghostId: first.ghostId, token: first.token },
        { ghostId: "", token: first.token },
        { ghostId: second.ghostId, token: "" },
        { ghostId: "ghost-spoofed", token: spoofed.token },
        { ghostId: second.ghostId, token: second.token },
      ]),
      ["ghost-first", "ghost-second"],
    );
  });

  it("rejects expired tokens", () => {
    process.env.GHOST_HMAC_SECRET = "test-secret-min-32-chars-long!!";
    const originalNow = Date.now;
    try {
      Date.now = () => 1_000;
      const { token, ghostId } = signGhostToken("ghost-expired");

      Date.now = () => 91 * 24 * 60 * 60 * 1_000;
      assert.deepEqual(
        verifyClientOrphanGhostPossession([{ ghostId, token }]),
        [],
      );
    } finally {
      Date.now = originalNow;
    }
  });
});
