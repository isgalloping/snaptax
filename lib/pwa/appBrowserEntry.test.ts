import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateAppBrowserEntryGate,
  isAppBrowserEntryPlatform,
} from "./appBrowserEntry.ts";

const ANDROID_CHROME_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
const ANDROID_EDGE_UA =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36 EdgA/124.0.0.0";
const IPHONE_SAFARI_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPAD_SAFARI_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

describe("isAppBrowserEntryPlatform", () => {
  it("includes Android Chrome", () => {
    assert.equal(isAppBrowserEntryPlatform(ANDROID_CHROME_UA), true);
  });

  it("excludes Android Edge", () => {
    assert.equal(isAppBrowserEntryPlatform(ANDROID_EDGE_UA), false);
  });

  it("includes iPhone and iPad Safari", () => {
    assert.equal(isAppBrowserEntryPlatform(IPHONE_SAFARI_UA), true);
    assert.equal(isAppBrowserEntryPlatform(IPAD_SAFARI_UA), true);
  });
});

describe("evaluateAppBrowserEntryGate", () => {
  const base = {
    pathname: "/app",
    standalone: false,
    landingDone: true,
    gateDismissed: false,
    userAgent: ANDROID_CHROME_UA,
  };

  it("eligible on Android Chrome /app after landing", () => {
    assert.equal(evaluateAppBrowserEntryGate(base), "eligible");
  });

  it("blocks standalone", () => {
    assert.equal(
      evaluateAppBrowserEntryGate({ ...base, standalone: true }),
      "standalone",
    );
  });

  it("blocks wrong path", () => {
    assert.equal(
      evaluateAppBrowserEntryGate({ ...base, pathname: "/pricing" }),
      "wrong-path",
    );
  });

  it("blocks before landing", () => {
    assert.equal(
      evaluateAppBrowserEntryGate({ ...base, landingDone: false }),
      "landing-pending",
    );
  });

  it("blocks when dismissed this session", () => {
    assert.equal(
      evaluateAppBrowserEntryGate({ ...base, gateDismissed: true }),
      "dismissed",
    );
  });

  it("blocks Android Edge", () => {
    assert.equal(
      evaluateAppBrowserEntryGate({
        ...base,
        userAgent: ANDROID_EDGE_UA,
      }),
      "wrong-platform",
    );
  });
});
