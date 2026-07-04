import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { computeBatchOcrWaitTimeoutMs } from "@/lib/client/batchCaptureFlush";

describe("computeBatchOcrWaitTimeoutMs", () => {
  it("returns 0 for empty batch or skipped OCR", () => {
    assert.equal(computeBatchOcrWaitTimeoutMs(0, false), 0);
    assert.equal(computeBatchOcrWaitTimeoutMs(4, true), 0);
  });

  it("scales beyond default for multi-shot batches", () => {
    const four = computeBatchOcrWaitTimeoutMs(4, false);
    assert.ok(four >= 180_000);
    assert.equal(four, Math.max(180_000, 4 * 45_000));
  });
});

describe("batchCaptureFlush upload loop", () => {
  it("does not gate flush on OCR", () => {
    const src = readFileSync("lib/client/batchCaptureFlush.ts", "utf8");
    assert.equal(src.includes("shouldBlockUploadForOcr"), false);
    assert.equal(src.includes("waitForOcrJobs"), false);
  });
});
