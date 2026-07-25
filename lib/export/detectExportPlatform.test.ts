import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectExportPlatform } from "./detectExportPlatform";

describe("detectExportPlatform", () => {
  it("detects Android Chrome", () => {
    assert.equal(
      detectExportPlatform(
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
      ),
      "android-chrome",
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
