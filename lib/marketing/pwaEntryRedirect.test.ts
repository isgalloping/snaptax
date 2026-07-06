import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PWA_APP_ENTRY,
  shouldRedirectMarketingToApp,
} from "./pwaEntryRedirect.ts";

describe("shouldRedirectMarketingToApp", () => {
  it("redirects home and funnel pages", () => {
    assert.equal(shouldRedirectMarketingToApp("/"), true);
    assert.equal(shouldRedirectMarketingToApp("/features"), true);
    assert.equal(shouldRedirectMarketingToApp("/faq"), true);
    assert.equal(shouldRedirectMarketingToApp("/contact"), true);
    assert.equal(shouldRedirectMarketingToApp("/blog"), true);
    assert.equal(shouldRedirectMarketingToApp("/blog/tax-tips"), true);
  });

  it("does not redirect legal, pricing, or app paths", () => {
    assert.equal(shouldRedirectMarketingToApp("/privacy"), false);
    assert.equal(shouldRedirectMarketingToApp("/terms"), false);
    assert.equal(shouldRedirectMarketingToApp("/pricing"), false);
    assert.equal(shouldRedirectMarketingToApp("/help"), false);
    assert.equal(shouldRedirectMarketingToApp(PWA_APP_ENTRY), false);
    assert.equal(shouldRedirectMarketingToApp(`${PWA_APP_ENTRY}/settings`), false);
  });
});
