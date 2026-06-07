import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldRecalcOnLogin } from "./shouldRecalcOnLogin.ts";

test("skip recalc when regions match", () => {
  assert.equal(shouldRecalcOnLogin("us", "us"), false);
  assert.equal(shouldRecalcOnLogin("eu", "eu"), false);
});

test("recalc when regions differ", () => {
  assert.equal(shouldRecalcOnLogin("us", "eu"), true);
  assert.equal(shouldRecalcOnLogin("eu", "us"), true);
});
