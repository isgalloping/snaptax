import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  INSTALL_DISMISS_DAYS,
  isDismissedWithinWindow,
  isLandingDone,
  resolveInstallUiMode,
} from "./deferredInstall";

describe("isDismissedWithinWindow", () => {
  it("returns false when no dismiss timestamp", () => {
    assert.equal(isDismissedWithinWindow(null, Date.now()), false);
  });

  it("returns true inside 7-day window", () => {
    const now = Date.parse("2026-06-10T12:00:00.000Z");
    const dismissedAt = new Date(
      now - (INSTALL_DISMISS_DAYS - 1) * 86_400_000,
    ).toISOString();
    assert.equal(isDismissedWithinWindow(dismissedAt, now), true);
  });

  it("returns false after 7-day window", () => {
    const now = Date.parse("2026-06-10T12:00:00.000Z");
    const dismissedAt = new Date(
      now - (INSTALL_DISMISS_DAYS + 1) * 86_400_000,
    ).toISOString();
    assert.equal(isDismissedWithinWindow(dismissedAt, now), false);
  });

  it("returns false for invalid timestamp", () => {
    assert.equal(isDismissedWithinWindow("not-a-date", Date.now()), false);
  });
});

describe("resolveInstallUiMode", () => {
  it("returns none when not eligible", () => {
    assert.equal(resolveInstallUiMode(false, false), "none");
    assert.equal(resolveInstallUiMode(false, true), "none");
  });

  it("returns bar for eligible first-time path", () => {
    assert.equal(resolveInstallUiMode(true, false), "bar");
  });

  it("returns header-button after Not now", () => {
    assert.equal(resolveInstallUiMode(true, true), "header-button");
  });
});

describe("isLandingDone", () => {
  it("reads session mirror when html class is absent", () => {
    const storage = new Map<string, string>();
    (globalThis as { window?: typeof globalThis }).window = globalThis;
    (globalThis as { document?: Document }).document = {
      documentElement: {
        classList: {
          contains: () => false,
          add: () => {},
          remove: () => {},
        },
      },
    } as Document;
    (globalThis as { sessionStorage?: Storage }).sessionStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
      removeItem: (key) => {
        storage.delete(key);
      },
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };
    storage.set("snap1099_landing_done", "1");
    assert.equal(isLandingDone(), true);
  });
});
