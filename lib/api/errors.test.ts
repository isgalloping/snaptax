import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildErrorMeta,
  rateLimitError,
  resolveApiError,
} from "./errors.ts";

test("resolveApiError maps known codes", () => {
  const r = resolveApiError(new Error("UNAUTHORIZED"));
  assert.equal(r.code, "UNAUTHORIZED");
  assert.equal(r.status, 401);
});

test("resolveApiError defaults to INTERNAL_ERROR for unknown", () => {
  const r = resolveApiError(new Error("OpenAI timeout"));
  assert.equal(r.code, "INTERNAL_ERROR");
  assert.equal(r.status, 500);
});

test("buildErrorMeta preserves raw message for logs", () => {
  const meta = buildErrorMeta(new Error("BLOB_CREDENTIALS_MISSING"));
  assert.equal(meta.errorCode, "BLOB_CREDENTIALS_MISSING");
  assert.equal(meta.errorMessage, "BLOB_CREDENTIALS_MISSING");
});

test("rateLimitError sets Retry-After header", async () => {
  const res = rateLimitError(42);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("Retry-After"), "42");
  const body = (await res.json()) as { error: { code: string } };
  assert.equal(body.error.code, "RATE_LIMITED");
});
