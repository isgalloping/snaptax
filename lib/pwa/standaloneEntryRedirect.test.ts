import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PWA_APP_ENTRY } from "@/lib/marketing/pwaEntryRedirect.ts";
import {
  resolveStandaloneEntryRedirect,
  shouldRedirectStandaloneToApp,
} from "./standaloneEntryRedirect.ts";

describe("shouldRedirectStandaloneToApp", () => {
  it("redirects marketing and legacy root paths in standalone", () => {
    assert.equal(shouldRedirectStandaloneToApp("/"), true);
    assert.equal(shouldRedirectStandaloneToApp("/features"), true);
    assert.equal(shouldRedirectStandaloneToApp("/pricing"), true);
    assert.equal(shouldRedirectStandaloneToApp("/privacy"), true);
  });

  it("does not redirect app or offline paths", () => {
    assert.equal(shouldRedirectStandaloneToApp(PWA_APP_ENTRY), false);
    assert.equal(
      shouldRedirectStandaloneToApp(`${PWA_APP_ENTRY}/settings`),
      false,
    );
    assert.equal(shouldRedirectStandaloneToApp("/offline"), false);
  });
});

describe("resolveStandaloneEntryRedirect", () => {
  it("returns /app for redirectable paths", () => {
    assert.equal(resolveStandaloneEntryRedirect("/"), PWA_APP_ENTRY);
    assert.equal(resolveStandaloneEntryRedirect(PWA_APP_ENTRY), null);
    assert.equal(resolveStandaloneEntryRedirect("/offline"), null);
  });
});
