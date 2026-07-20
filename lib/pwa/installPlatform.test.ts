import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectInstallPlatform,
  isAndroidChromeWebApkBrowser,
  isInstallPlatformEligible,
  manualCopyKeyForPlatform,
  supportsNativeInstallPrompt,
} from "./installPlatform";

describe("detectInstallPlatform", () => {
  it("detects Android Chrome", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";
    assert.equal(detectInstallPlatform(ua), "chromium-android");
  });

  it("detects Android Edge", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 10; HD1913) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36 EdgA/120.0.0.0";
    assert.equal(detectInstallPlatform(ua), "chromium-android");
  });

  it("detects iOS Safari", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
    assert.equal(detectInstallPlatform(ua), "ios-safari");
  });

  it("excludes iOS Chrome", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120.0.0.0 Mobile/15E148 Safari/604.1";
    assert.equal(detectInstallPlatform(ua), "none");
  });

  it("detects macOS Safari", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15";
    assert.equal(detectInstallPlatform(ua), "macos-safari");
  });

  it("detects desktop Edge", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
    assert.equal(detectInstallPlatform(ua), "chromium-desktop");
  });

  it("detects desktop Chrome", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36";
    assert.equal(detectInstallPlatform(ua), "chromium-desktop");
  });
});

describe("isAndroidChromeWebApkBrowser", () => {
  it("matches Chrome but not Edge or Opera on Android", () => {
    const chrome =
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";
    const edge =
      "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36 EdgA/120.0.0.0";
    const opera =
      "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/91.0.4472.114 Mobile Safari/537.36 OPR/64.0.2254.54253";

    assert.equal(isAndroidChromeWebApkBrowser(chrome), true);
    assert.equal(isAndroidChromeWebApkBrowser(edge), false);
    assert.equal(isAndroidChromeWebApkBrowser(opera), false);
  });
});

describe("platform helpers", () => {
  it("marks supported platforms eligible", () => {
    assert.equal(isInstallPlatformEligible("ios-safari"), true);
    assert.equal(isInstallPlatformEligible("none"), false);
  });

  it("native prompt only on chromium", () => {
    assert.equal(supportsNativeInstallPrompt("chromium-android"), true);
    assert.equal(supportsNativeInstallPrompt("ios-safari"), false);
  });

  it("maps manual copy keys", () => {
    assert.equal(manualCopyKeyForPlatform("ios-safari"), "iosSafari");
    assert.equal(manualCopyKeyForPlatform("none"), null);
  });
});
