import { test } from "node:test";
import assert from "node:assert/strict";
import { signGhostToken, verifyGhostToken } from "./ghostToken.ts";

test("sign and verify ghost token", () => {
  process.env.GHOST_HMAC_SECRET = "test-secret-min-32-chars-long!!";
  const { token, ghostId } = signGhostToken();
  const payload = verifyGhostToken(token);
  assert.equal(payload.ghostId, ghostId);
});

test("reject tampered token", () => {
  process.env.GHOST_HMAC_SECRET = "test-secret-min-32-chars-long!!";
  const { token } = signGhostToken();
  assert.throws(() => verifyGhostToken(token.slice(0, -1) + "x"));
});
