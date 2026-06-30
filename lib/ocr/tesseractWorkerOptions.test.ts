import { test } from "node:test";
import assert from "node:assert/strict";
import { tesseractCreateWorkerOptions } from "./tesseractWorkerOptions";

test("tesseractCreateWorkerOptions uses same-origin paths", () => {
  const opts = tesseractCreateWorkerOptions();
  assert.match(opts.workerPath, /^\/tesseract\//);
  assert.match(opts.corePath, /^\/tesseract\//);
  assert.match(opts.langPath, /^\/tesseract\//);
  assert.doesNotMatch(opts.workerPath, /jsdelivr/);
});
