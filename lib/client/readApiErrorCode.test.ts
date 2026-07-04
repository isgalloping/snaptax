import assert from "node:assert/strict";
import test from "node:test";
import { readApiErrorCode } from "./readApiErrorCode";

test("readApiErrorCode returns code from error body", async () => {
  const res = new Response(JSON.stringify({ error: { code: "FOUNDER_PROGRAM_FULL" } }), {
    status: 409,
  });
  assert.equal(await readApiErrorCode(res), "FOUNDER_PROGRAM_FULL");
});

test("readApiErrorCode returns null for invalid json", async () => {
  const res = new Response("not json", { status: 500 });
  assert.equal(await readApiErrorCode(res), null);
});
