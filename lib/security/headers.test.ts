import { test } from "node:test";
import assert from "node:assert/strict";
import { securityHeaders } from "./headers";

test("securityHeaders includes baseline protections", () => {
  const headers = securityHeaders();
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(headers["Content-Security-Policy"], /accounts\.google\.com/);
  assert.match(headers["Content-Security-Policy"], /paddle\.com/);
});
