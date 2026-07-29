import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldInterceptMarketingAppNavigation } from "./shouldInterceptMarketingAppNavigation.ts";

const CHROME_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";
const EDGE_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36 EdgA/120.0.0.0";
const OPERA_ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/91.0.4472.114 Mobile Safari/537.36 OPR/64.0.2254.54253";
const FIREFOX_ANDROID_UA =
  "Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0";

describe("shouldInterceptMarketingAppNavigation", () => {
  it("intercepts Safari platforms when PWA is marked installed locally", () => {
    assert.equal(
      shouldInterceptMarketingAppNavigation("ios-safari", true),
      true,
    );
    assert.equal(
      shouldInterceptMarketingAppNavigation("macos-safari", true),
      true,
    );
    assert.equal(
      shouldInterceptMarketingAppNavigation("ios-safari", false),
      false,
    );
  });

  it("does not intercept desktop Chromium so native link capture works", () => {
    for (const platform of ["chromium-desktop"] as const) {
      assert.equal(
        shouldInterceptMarketingAppNavigation(platform, true),
        false,
        platform,
      );
    }
  });

  it("does not intercept Android Chrome so WebAPK link capture works", () => {
    assert.equal(
      shouldInterceptMarketingAppNavigation(
        "chromium-android",
        true,
        CHROME_ANDROID_UA,
      ),
      false,
    );
  });

  it("intercepts Android Edge, Opera, and Firefox when installed", () => {
    assert.equal(
      shouldInterceptMarketingAppNavigation(
        "chromium-android",
        true,
        EDGE_ANDROID_UA,
      ),
      true,
    );
    assert.equal(
      shouldInterceptMarketingAppNavigation(
        "chromium-android",
        true,
        OPERA_ANDROID_UA,
      ),
      true,
    );
    assert.equal(
      shouldInterceptMarketingAppNavigation("none", true, FIREFOX_ANDROID_UA),
      true,
    );
  });
});
