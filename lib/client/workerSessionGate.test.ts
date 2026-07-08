import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasWorkerCatchUp,
  isWorkerSessionActive,
  mergeWorkerCatchUpFlags,
} from "./workerSessionGate.ts";

describe("isWorkerSessionActive", () => {
  it("is active when camera is open", () => {
    assert.equal(isWorkerSessionActive({ cameraOpen: true }), true);
    assert.equal(isWorkerSessionActive({ cameraOpen: false }), false);
  });
});

describe("mergeWorkerCatchUpFlags", () => {
  it("accumulates pending work", () => {
    const a = mergeWorkerCatchUpFlags({}, { flushUploads: true });
    const b = mergeWorkerCatchUpFlags(a, { sync: true, flushUploads: false });
    assert.equal(b.flushUploads, true);
    assert.equal(b.sync, true);
    assert.equal(hasWorkerCatchUp(b), true);
  });

  it("hasWorkerCatchUp is false for empty flags", () => {
    assert.equal(hasWorkerCatchUp({}), false);
  });
});
