import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateInstalledSignals,
  resolveInstallUiModeWithInstalled,
} from "./installedDetect";

describe("evaluateInstalledSignals", () => {
  it("returns installed when standalone", () => {
    const r = evaluateInstalledSignals({
      standalone: true,
      hasRelatedAppsApi: true,
      relatedAppCount: 0,
      stickyLocal: false,
    });
    assert.equal(r.installed, true);
    assert.equal(r.shouldMarkLocal, true);
    assert.equal(r.shouldClearLocal, false);
  });

  it("returns installed when Chromium related apps hit", () => {
    const r = evaluateInstalledSignals({
      standalone: false,
      hasRelatedAppsApi: true,
      relatedAppCount: 1,
      stickyLocal: false,
    });
    assert.equal(r.installed, true);
    assert.equal(r.shouldMarkLocal, true);
    assert.equal(r.shouldClearLocal, false);
  });

  it("clears sticky when Chromium related apps empty", () => {
    const r = evaluateInstalledSignals({
      standalone: false,
      hasRelatedAppsApi: true,
      relatedAppCount: 0,
      stickyLocal: true,
    });
    assert.equal(r.installed, false);
    assert.equal(r.shouldMarkLocal, false);
    assert.equal(r.shouldClearLocal, true);
  });

  it("trusts sticky local when no related apps API", () => {
    const r = evaluateInstalledSignals({
      standalone: false,
      hasRelatedAppsApi: false,
      relatedAppCount: 0,
      stickyLocal: true,
    });
    assert.equal(r.installed, true);
    assert.equal(r.shouldClearLocal, false);
  });

  it("not installed when no API and no sticky", () => {
    const r = evaluateInstalledSignals({
      standalone: false,
      hasRelatedAppsApi: false,
      relatedAppCount: 0,
      stickyLocal: false,
    });
    assert.equal(r.installed, false);
  });
});

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
