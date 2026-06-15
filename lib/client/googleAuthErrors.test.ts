import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GoogleAuthError,
  mapGoogleAuthErrorMessage,
} from "./googleAuthErrors.ts";

const messages = {
  signInFailed: "failed",
  signInUnauthorized: "unauthorized",
  signInGhostBound: "bound",
  signInServerError: "server",
  signInConfig: "config",
  ghostRegisterFailed: "ghost",
};

describe("mapGoogleAuthErrorMessage", () => {
  it("maps API error codes", () => {
    assert.equal(
      mapGoogleAuthErrorMessage(new GoogleAuthError("UNAUTHORIZED"), messages),
      "unauthorized",
    );
    assert.equal(
      mapGoogleAuthErrorMessage(
        new GoogleAuthError("GHOST_ALREADY_BOUND"),
        messages,
      ),
      "bound",
    );
    assert.equal(
      mapGoogleAuthErrorMessage(new GoogleAuthError("INTERNAL_ERROR"), messages),
      "server",
    );
  });

  it("returns null for user-cancelled GIS", () => {
    assert.equal(
      mapGoogleAuthErrorMessage(new Error("GOOGLE_SIGN_IN_CANCELLED"), messages),
      null,
    );
  });

  it("maps client config and ghost errors", () => {
    assert.equal(
      mapGoogleAuthErrorMessage(new Error("GOOGLE_CLIENT_ID missing"), messages),
      "config",
    );
    assert.equal(
      mapGoogleAuthErrorMessage(new Error("ghost register failed"), messages),
      "ghost",
    );
  });
});
