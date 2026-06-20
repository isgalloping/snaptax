import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOcrDraft } from "@/lib/ocr/runLocalOcr";
import {
  OCR_MAX_QUEUE_DEPTH,
  activeOcrQueueDepth,
  deferBatchOcrUpload,
  isBatchOcrUploadDeferred,
  isOcrJobPending,
  releaseBatchOcrUpload,
  resetOcrJobStateForTests,
  shouldBlockUploadForOcr,
  shouldEnqueueOcrJob,
  simulateOcrJobScheduledForTests,
  waitForOcrJobs,
} from "@/lib/client/scheduleOcrJob";

describe("scheduleOcrJob batch defer", () => {
  it("tracks defer and release for batch session ids", () => {
    resetOcrJobStateForTests();
    deferBatchOcrUpload(["a", "b"]);
    assert.equal(isBatchOcrUploadDeferred("a"), true);
    assert.equal(isBatchOcrUploadDeferred("b"), true);
    releaseBatchOcrUpload(["a"]);
    assert.equal(isBatchOcrUploadDeferred("a"), false);
    assert.equal(isBatchOcrUploadDeferred("b"), true);
    releaseBatchOcrUpload(["b"]);
    assert.equal(isBatchOcrUploadDeferred("b"), false);
  });
});

describe("shouldEnqueueOcrJob", () => {
  it("allows enqueue below max depth", () => {
    assert.equal(shouldEnqueueOcrJob(0), true);
    assert.equal(shouldEnqueueOcrJob(OCR_MAX_QUEUE_DEPTH - 1), true);
  });

  it("skips new jobs at or above max depth", () => {
    assert.equal(shouldEnqueueOcrJob(OCR_MAX_QUEUE_DEPTH), false);
    assert.equal(shouldEnqueueOcrJob(OCR_MAX_QUEUE_DEPTH + 1), false);
  });
});

describe("isOcrJobPending", () => {
  it("is true while scheduled and not finished", () => {
    resetOcrJobStateForTests();
    simulateOcrJobScheduledForTests("r1", { inQueue: true });
    assert.equal(isOcrJobPending("r1"), true);
  });

  it("is false after finished", () => {
    resetOcrJobStateForTests();
    simulateOcrJobScheduledForTests("r1", { inQueue: true, finished: true });
    assert.equal(isOcrJobPending("r1"), false);
  });

  it("is false for never-scheduled ids", () => {
    resetOcrJobStateForTests();
    assert.equal(isOcrJobPending("missing"), false);
  });
});

describe("activeOcrQueueDepth", () => {
  it("counts pending queue and in-flight jobs", () => {
    resetOcrJobStateForTests();
    simulateOcrJobScheduledForTests("a", { inQueue: true });
    simulateOcrJobScheduledForTests("b", { inQueue: true });
    simulateOcrJobScheduledForTests("c", { inFlight: true });
    assert.equal(activeOcrQueueDepth(), 3);
    assert.equal(shouldEnqueueOcrJob(), false);
  });
});

describe("waitForOcrJobs", () => {
  it("resolves immediately for empty ids", async () => {
    resetOcrJobStateForTests();
    await waitForOcrJobs([]);
  });

  it("resolves immediately for ids that were never scheduled", async () => {
    resetOcrJobStateForTests();
    const started = Date.now();
    await waitForOcrJobs(["never-scheduled"], 1000);
    assert.ok(Date.now() - started < 200);
  });

  it("waits until scheduled jobs finish", async () => {
    resetOcrJobStateForTests();
    simulateOcrJobScheduledForTests("wait-me", { inQueue: true });
    const started = Date.now();
    const waitPromise = waitForOcrJobs(["wait-me"], 2000);
    globalThis.setTimeout(() => {
      simulateOcrJobScheduledForTests("wait-me", { finished: true });
    }, 80);
    await waitPromise;
    assert.ok(Date.now() - started >= 50);
    assert.equal(isOcrJobPending("wait-me"), false);
  });
});

describe("shouldBlockUploadForOcr", () => {
  it("does not block when ocrDraft already persisted", () => {
    resetOcrJobStateForTests();
    simulateOcrJobScheduledForTests("r1", { inQueue: true });
    const draft = buildOcrDraft({
      text: "",
      confidence: 0,
      engine: "skipped",
      durationMs: 0,
    });
    assert.equal(
      shouldBlockUploadForOcr({ id: "r1", ocrDraft: draft }),
      false,
    );
  });

  it("blocks while OCR is in flight without draft", () => {
    resetOcrJobStateForTests();
    simulateOcrJobScheduledForTests("r1", { inQueue: true });
    assert.equal(shouldBlockUploadForOcr({ id: "r1" }), true);
  });
});

describe("skipped ocr draft", () => {
  it("builds engine skipped payload for queue-full path", () => {
    const draft = buildOcrDraft({
      text: "",
      confidence: 0,
      engine: "skipped",
      durationMs: 0,
    });
    assert.equal(draft.engine, "skipped");
    assert.equal(draft.parsed.signals.merchantMissing, true);
    assert.equal(draft.parsed.signals.totalMissing, true);
  });
});
