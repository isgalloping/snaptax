import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseCaptureModeHeader,
  shouldRunSimilarDuplicateCheck,
} from "@/lib/receipts/captureMode";

describe("parseCaptureModeHeader", () => {
  it("returns batch when header is batch", () => {
    assert.equal(parseCaptureModeHeader("batch"), "batch");
  });

  it("defaults to single for missing or unknown values", () => {
    assert.equal(parseCaptureModeHeader(null), "single");
    assert.equal(parseCaptureModeHeader("single"), "single");
    assert.equal(parseCaptureModeHeader("other"), "single");
  });
});

describe("shouldRunSimilarDuplicateCheck", () => {
  it("skips similar dedup for batch capture mode", () => {
    assert.equal(shouldRunSimilarDuplicateCheck("batch"), false);
  });

  it("runs similar dedup for single capture mode", () => {
    assert.equal(shouldRunSimilarDuplicateCheck("single"), true);
  });
});
