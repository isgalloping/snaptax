import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldSubmitLateOcrDraft } from "./lateOcrDraftSync.ts";

const baseDraft = {
  text: "HOME DEPOT\nTOTAL 12.34",
  confidence: 0.9,
  parsed: {
    merchant: "Home Depot",
    total: 12.34,
    rawText: "HOME DEPOT\nTOTAL 12.34",
    signals: {
      merchantMissing: false,
      totalMissing: false,
      garbleRatio: 0,
    },
  },
  engine: "onnx" as const,
  preprocessVersion: 2 as const,
};

describe("shouldSubmitLateOcrDraft", () => {
  it("returns true when upload finished and OCR draft is usable", () => {
    assert.equal(
      shouldSubmitLateOcrDraft({
        hasRemoteImage: true,
        pendingUpload: false,
        status: "processing",
        ocrDraft: baseDraft,
      }),
      true,
    );
  });

  it("returns false while upload is still pending", () => {
    assert.equal(
      shouldSubmitLateOcrDraft({
        hasRemoteImage: false,
        pendingUpload: true,
        status: "processing",
        ocrDraft: baseDraft,
      }),
      false,
    );
  });

  it("returns false for skipped or low-quality drafts", () => {
    assert.equal(
      shouldSubmitLateOcrDraft({
        hasRemoteImage: true,
        pendingUpload: false,
        status: "processing",
        ocrDraft: { ...baseDraft, engine: "skipped" },
      }),
      false,
    );
    assert.equal(
      shouldSubmitLateOcrDraft({
        hasRemoteImage: true,
        pendingUpload: false,
        status: "processing",
        ocrDraft: { ...baseDraft, confidence: 0.2 },
      }),
      false,
    );
  });
});
