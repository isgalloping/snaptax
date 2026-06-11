import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveInstallUiModeWithInstalled } from "./installedDetect";

describe("resolveInstallUiModeWithInstalled", () => {
  it("returns none when installed on device", () => {
    assert.equal(
      resolveInstallUiModeWithInstalled(true, true, false),
      "none",
    );
  });

  it("returns bar when eligible and not dismissed", () => {
    assert.equal(
      resolveInstallUiModeWithInstalled(false, true, false),
      "bar",
    );
  });

  it("returns header-button after Not now", () => {
    assert.equal(
      resolveInstallUiModeWithInstalled(false, true, true),
      "header-button",
    );
  });

  it("returns none when not eligible", () => {
    assert.equal(
      resolveInstallUiModeWithInstalled(false, false, false),
      "none",
    );
  });
});
