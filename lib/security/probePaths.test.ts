import { test } from "node:test";
import assert from "node:assert/strict";
import { isAutomatedSecurityProbe } from "./probePaths";

test("isAutomatedSecurityProbe matches env and git scans from production logs", () => {
  assert.equal(isAutomatedSecurityProbe("/.env"), true);
  assert.equal(isAutomatedSecurityProbe("/.env.local"), true);
  assert.equal(isAutomatedSecurityProbe("/.env.production"), true);
  assert.equal(isAutomatedSecurityProbe("/.git/HEAD"), true);
  assert.equal(isAutomatedSecurityProbe("/.git/config"), true);
});

test("isAutomatedSecurityProbe matches credential dump filenames", () => {
  assert.equal(isAutomatedSecurityProbe("/service-account.json"), true);
  assert.equal(isAutomatedSecurityProbe("/credentials.json"), true);
  assert.equal(isAutomatedSecurityProbe("/api/env"), true);
  assert.equal(isAutomatedSecurityProbe("/api/config"), true);
});

test("isAutomatedSecurityProbe ignores normal app routes", () => {
  assert.equal(isAutomatedSecurityProbe("/"), false);
  assert.equal(isAutomatedSecurityProbe("/privacy"), false);
  assert.equal(isAutomatedSecurityProbe("/robots.txt"), false);
  assert.equal(isAutomatedSecurityProbe("/sitemap.xml"), false);
  assert.equal(isAutomatedSecurityProbe("/api/receipts"), false);
});
