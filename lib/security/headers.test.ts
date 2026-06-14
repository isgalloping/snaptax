import { test } from "node:test";
import assert from "node:assert/strict";
import { securityHeaders } from "./headers";

test("securityHeaders includes baseline protections", () => {
  const headers = securityHeaders();
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(headers["Content-Security-Policy"], /accounts\.google\.com/);
  assert.match(headers["Content-Security-Policy"], /www\.gstatic\.com/);
  assert.match(headers["Content-Security-Policy"], /fonts\.gstatic\.com/);
  assert.match(headers["Content-Security-Policy"], /paddle\.com/);
});

test("securityHeaders allows unsafe-eval only in development", () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  assert.match(securityHeaders()["Content-Security-Policy"], /'unsafe-eval'/);
  process.env.NODE_ENV = "production";
  assert.doesNotMatch(
    securityHeaders()["Content-Security-Policy"],
    /'unsafe-eval'/,
  );
  process.env.NODE_ENV = prev;
});
