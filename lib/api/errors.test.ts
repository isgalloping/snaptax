import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildErrorMeta,
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
