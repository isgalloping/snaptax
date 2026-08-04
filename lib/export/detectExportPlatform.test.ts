import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectExportPlatform } from "./detectExportPlatform";

describe("detectExportPlatform", () => {
  const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator",
  );

  afterEach(() => {
    if (originalNavigatorDescriptor) {
      Object.defineProperty(globalThis, "navigator", originalNavigatorDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "navigator");
    }
  });

  it("detects Android Chrome", () => {
    assert.equal(
      detectExportPlatform(
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
      ),
      "android-chrome",
    );
  });

  it("treats Android Edge as the Android Chromium download flow", () => {
    assert.equal(
      detectExportPlatform(
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0.0.0 Mobile Safari/537.36 EdgA/125.0.0.0",
      ),
      "android-chrome",
    );
  });

  it("does not classify Android Firefox as Android Chrome", () => {
    assert.equal(
      detectExportPlatform(
        "Mozilla/5.0 (Android 14; Mobile; rv:126.0) Gecko/126.0 Firefox/126.0",
      ),
      "other",
    );
  });

  it("detects iOS Safari", () => {
    assert.equal(
      detectExportPlatform(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1",
      ),
      "ios-safari",
    );
  });

  it("detects iPadOS desktop-mode Safari from touch-capable Mac navigator", () => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        platform: "MacIntel",
        maxTouchPoints: 5,
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15",
      },
    });

    assert.equal(
      detectExportPlatform(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15",
      ),
      "ios-safari",
    );
  });

  it("detects desktop Chrome", () => {
    assert.equal(
      detectExportPlatform(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      ),
      "desktop-chrome",
    );
  });

  it("falls back to other", () => {
    assert.equal(
      detectExportPlatform("Mozilla/5.0 (compatible; SomeBot/1.0)"),
      "other",
    );
  });
});
