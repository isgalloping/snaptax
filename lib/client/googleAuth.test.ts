import { test } from "node:test";
import assert from "node:assert/strict";
import { mapGoogleAuthError } from "./googleAuth";

const failed = "Sign-in failed. Please try again.";

test("mapGoogleAuthError returns null for user cancellation", () => {
  assert.equal(
    mapGoogleAuthError(new Error("GOOGLE_SIGN_IN_CANCELLED"), failed),
    null,
  );
});

test("mapGoogleAuthError maps known GIS and auth failures", () => {
  for (const code of [
    "GIS_LOAD_FAILED",
    "GIS_NOT_READY",
    "GIS_BUTTON_FAILED",
    "GOOGLE_SIGN_IN_TIMEOUT",
    "ghost register failed",
    "GOOGLE_AUTH_FAILED",
    "GOOGLE_CLIENT_ID missing",
  ]) {
    assert.equal(mapGoogleAuthError(new Error(code), failed), failed);
  }
});

test("mapGoogleAuthError falls back for unknown errors", () => {
  assert.equal(mapGoogleAuthError(new Error("network down"), failed), failed);
  assert.equal(mapGoogleAuthError("oops", failed), failed);
});
