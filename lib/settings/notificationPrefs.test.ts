import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  countEnabledPrefs,
  readNotificationPrefs,
  writeNotificationPref,
} from "@/lib/settings/notificationPrefs";

describe("notificationPrefs", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    (globalThis as { localStorage?: Storage }).localStorage = {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => {
        storage.set(k, v);
      },
      removeItem: (k) => {
        storage.delete(k);
      },
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };
  });

  afterEach(() => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it("defaults three on marketing off", () => {
    const prefs = readNotificationPrefs();
    assert.equal(prefs.deadlines, true);
    assert.equal(prefs.marketing, false);
    assert.equal(countEnabledPrefs(prefs), 3);
  });

  it("persists toggle", () => {
    writeNotificationPref("marketing", true);
    assert.equal(readNotificationPrefs().marketing, true);
    assert.equal(countEnabledPrefs(readNotificationPrefs()), 4);
  });
});
