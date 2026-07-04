import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateHiddenBackgroundSync } from "@/lib/client/backgroundSyncGate";
import { isIosUserAgent } from "@/lib/client/platform/isIos";

describe("isIosUserAgent", () => {
  it("detects iPhone, iPad, and iPod", () => {
    assert.equal(
      isIosUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      ),
      true,
    );
    assert.equal(
      isIosUserAgent(
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      ),
      true,
    );
    assert.equal(
      isIosUserAgent(
        "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15",
      ),
      true,
    );
  });

  it("returns false for Android and desktop", () => {
    assert.equal(
      isIosUserAgent(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
      ),
      false,
    );
    assert.equal(
      isIosUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
      false,
    );
  });
});

describe("evaluateHiddenBackgroundSync", () => {
  it("allows hidden background sync when online and not iOS", () => {
    assert.equal(
      evaluateHiddenBackgroundSync({
        hasDocument: true,
        documentHidden: true,
        navigatorOnline: true,
        ios: false,
      }),
      true,
    );
  });

  it("blocks when visible, offline, iOS, or no document", () => {
    assert.equal(
      evaluateHiddenBackgroundSync({
        hasDocument: true,
        documentHidden: false,
        navigatorOnline: true,
        ios: false,
      }),
      false,
    );
    assert.equal(
      evaluateHiddenBackgroundSync({
        hasDocument: true,
        documentHidden: true,
        navigatorOnline: false,
        ios: false,
      }),
      false,
    );
    assert.equal(
      evaluateHiddenBackgroundSync({
        hasDocument: true,
        documentHidden: true,
        navigatorOnline: true,
        ios: true,
      }),
      false,
    );
    assert.equal(
      evaluateHiddenBackgroundSync({
        hasDocument: false,
        documentHidden: true,
        navigatorOnline: true,
        ios: false,
      }),
      false,
    );
  });
});
