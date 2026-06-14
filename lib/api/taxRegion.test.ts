import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  acceptLanguageSuggestsEu,
  resolveInitialDataRegion,
} from "./taxRegion";

describe("acceptLanguageSuggestsEu", () => {
  it("detects EU base languages", () => {
    assert.equal(acceptLanguageSuggestsEu("de-DE,de;q=0.9"), true);
  });

  it("returns false for en-US only", () => {
    assert.equal(acceptLanguageSuggestsEu("en-US,en;q=0.9"), false);
  });
});

describe("resolveInitialDataRegion", () => {
  it("downgrades spoofed eu header when language is en-US only", () => {
    const result = resolveInitialDataRegion({
      headerRegion: "eu",
      acceptLanguage: "en-US,en;q=0.9",
    });
    assert.equal(result.region, "us");
    assert.equal(result.adjusted, true);
    assert.equal(result.reason, "header_language_mismatch");
  });

  it("keeps eu when accept-language supports EU", () => {
    const result = resolveInitialDataRegion({
      headerRegion: "eu",
      acceptLanguage: "de-DE,de;q=0.9",
    });
    assert.equal(result.region, "eu");
    assert.equal(result.adjusted, false);
  });
});
