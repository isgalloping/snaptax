import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decodeNavKey,
  encodeNavKey,
  homeOverlayNavToKey,
  isLeavingExportCompleted,
  mapNavKeyToTarget,
  shouldPushNavKey,
} from "./appNavigationHistory.ts";

describe("encodeNavKey / decodeNavKey", () => {
  it("round-trips home", () => {
    const key = { kind: "home" as const };
    assert.equal(encodeNavKey(key), "home");
    assert.deepEqual(decodeNavKey("home"), key);
  });

  it("round-trips overlay ids", () => {
    const key = { kind: "overlay" as const, overlayId: "privacy-trust" };
    assert.equal(encodeNavKey(key), "overlay:privacy-trust");
    assert.deepEqual(decodeNavKey("overlay:privacy-trust"), key);
  });

  it("round-trips missing-deduction-item with hintId", () => {
    const key = {
      kind: "overlay" as const,
      overlayId: "missing-deduction-item",
      hintId: "fuel",
    };
    assert.equal(encodeNavKey(key), "overlay:missing-deduction-item:fuel");
    assert.deepEqual(decodeNavKey("overlay:missing-deduction-item:fuel"), key);
  });

  it("round-trips settings main and sub-pages", () => {
    assert.equal(
      encodeNavKey({ kind: "settings", page: "main" }),
      "settings",
    );
    assert.deepEqual(decodeNavKey("settings"), {
      kind: "settings",
      page: "main",
    });
    assert.equal(
      encodeNavKey({ kind: "settings", page: "language" }),
      "settings:language",
    );
    assert.deepEqual(decodeNavKey("settings:language"), {
      kind: "settings",
      page: "language",
    });
  });
});

describe("shouldPushNavKey", () => {
  it("skips duplicate consecutive keys", () => {
    const key = { kind: "overlay" as const, overlayId: "privacy-trust" };
    assert.equal(shouldPushNavKey(key, key), false);
  });

  it("allows different keys", () => {
    assert.equal(
      shouldPushNavKey(
        { kind: "overlay", overlayId: "privacy-trust" },
        { kind: "overlay", overlayId: "deadline-detail" },
      ),
      true,
    );
  });
});

describe("mapNavKeyToTarget", () => {
  it("maps overlay to home view", () => {
    assert.deepEqual(
      mapNavKeyToTarget({
        kind: "overlay",
        overlayId: "missing-deduction-item",
        hintId: "fuel",
      }),
      {
        view: "home",
        homeOverlay: { type: "missing-deduction-item", hintId: "fuel" },
        settingsPage: "main",
      },
    );
  });

  it("maps settings sub-page", () => {
    assert.deepEqual(
      mapNavKeyToTarget({ kind: "settings", page: "language" }),
      {
        view: "settings",
        homeOverlay: null,
        settingsPage: "language",
      },
    );
  });
});

describe("homeOverlayNavToKey", () => {
  it("encodes string overlay", () => {
    assert.deepEqual(homeOverlayNavToKey("privacy-trust"), {
      kind: "overlay",
      overlayId: "privacy-trust",
    });
  });
});

describe("isLeavingExportCompleted", () => {
  it("detects leaving export-completed", () => {
    assert.equal(isLeavingExportCompleted("export-completed", "main"), true);
    assert.equal(isLeavingExportCompleted("export-completed", "export-completed"), false);
  });
});
