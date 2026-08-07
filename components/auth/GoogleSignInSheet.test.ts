import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { postLoginSyncFailurePresentation } from "./GoogleSignInSheet.tsx";

describe("postLoginSyncFailurePresentation", () => {
  it("shows hard-gated post-login sync failures as errors", () => {
    assert.deepEqual(
      postLoginSyncFailurePresentation("hard-sync", "Sync failed"),
      { kind: "error", message: "Sync failed" },
    );
    assert.deepEqual(
      postLoginSyncFailurePresentation("hard-export", "Sync failed"),
      { kind: "error", message: "Sync failed" },
    );
  });

  it("keeps soft post-login sync failures non-blocking warnings", () => {
    assert.deepEqual(
      postLoginSyncFailurePresentation("soft", "Sync catching up"),
      { kind: "warning", message: "Sync catching up" },
    );
    assert.deepEqual(
      postLoginSyncFailurePresentation("onboarding-signup", "Sync catching up"),
      { kind: "warning", message: "Sync catching up" },
    );
  });
});
