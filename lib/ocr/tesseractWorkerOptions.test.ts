import { test } from "node:test";
import assert from "node:assert/strict";
import { tesseractCreateWorkerOptions } from "./tesseractWorkerOptions";

test("tesseractCreateWorkerOptions uses same-origin paths and disables blob worker", () => {
  const opts = tesseractCreateWorkerOptions();
  assert.match(opts.workerPath, /\/tesseract\/worker\.min\.js$/);
  assert.match(opts.corePath, /\/tesseract\/core$/);
  assert.match(opts.langPath, /\/tesseract\/lang$/);
  assert.doesNotMatch(opts.workerPath, /jsdelivr/);
  assert.equal(opts.workerBlobURL, false);
});
