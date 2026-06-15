import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SignOutOfflineError,
  isSignOutOfflineError,
  signOutAndResetSession,
} from "./signOutFlow.ts";

describe("signOutAndResetSession", () => {
  it("throws SignOutOfflineError when offline", async () => {
    await assert.rejects(
      () =>
        signOutAndResetSession({
          isOnline: () => false,
        }),
      (err: unknown) => {
        assert.ok(isSignOutOfflineError(err));
        assert.equal(err.code, "OFFLINE");
        return true;
      },
    );
  });

  it("calls signOutApi before ensureGhostSession when online", async () => {
    const order: string[] = [];

    await signOutAndResetSession({
      isOnline: () => true,
      signOutApi: async () => {
        order.push("signOut");
      },
      ensureGhostSession: async () => {
        order.push("ghost");
      },
    });

    assert.deepEqual(order, ["signOut", "ghost"]);
  });

  it("does not register ghost when signOutApi fails", async () => {
    let ghostRegistered = false;

    await assert.rejects(
      () =>
        signOutAndResetSession({
          isOnline: () => true,
          signOutApi: async () => {
            throw new Error("SIGN_OUT_FAILED");
          },
          ensureGhostSession: async () => {
            ghostRegistered = true;
          },
        }),
      /SIGN_OUT_FAILED/,
    );

    assert.equal(ghostRegistered, false);
  });
});

describe("SignOutOfflineError", () => {
  it("is recognized by isSignOutOfflineError", () => {
    assert.ok(isSignOutOfflineError(new SignOutOfflineError()));
    assert.equal(isSignOutOfflineError(new Error("OFFLINE")), false);
  });
});
