import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseOcrDraftJson,
  summarizeOcrDraftForAiRaw,
} from "@/lib/ocr/ocrDraftSchema";

const validDraft = {
  text: "LOCAL HARDWARE\nTOTAL $42.10",
  confidence: 0.88,
  engine: "tesseract",
  preprocessVersion: 1,
  parsed: {
    rawText: "LOCAL HARDWARE\nTOTAL $42.10",
    merchant: "LOCAL HARDWARE",
    total: 42.1,
    signals: {
      merchantMissing: false,
      totalMissing: false,
      garbleRatio: 0,
    },
  },
};

describe("parseOcrDraftJson", () => {
  it("accepts a valid OCR draft payload", () => {
    const parsed = parseOcrDraftJson(JSON.stringify(validDraft));

    assert.ok(parsed);
    assert.equal(parsed.text, validDraft.text);
    assert.equal(parsed.confidence, 0.88);
    assert.equal(parsed.parsed.total, 42.1);
  });

  it("rejects malformed JSON and invalid OCR draft shapes", () => {
    assert.equal(parseOcrDraftJson("{not json"), null);
    assert.equal(
      parseOcrDraftJson(
        JSON.stringify({
          ...validDraft,
          confidence: 1.01,
        }),
      ),
      null,
    );
    assert.equal(
      parseOcrDraftJson(
        JSON.stringify({
          ...validDraft,
          parsed: {
            ...validDraft.parsed,
            signals: {
              merchantMissing: false,
              totalMissing: false,
            },
          },
        }),
      ),
      null,
    );
  });
});

describe("summarizeOcrDraftForAiRaw", () => {
  it("persists only routing quality signals, not raw receipt text", () => {
    const parsed = parseOcrDraftJson(JSON.stringify(validDraft));
    assert.ok(parsed);

    assert.deepEqual(summarizeOcrDraftForAiRaw(parsed), {
      confidence: 0.88,
      engine: "tesseract",
      merchantMissing: false,
      totalMissing: false,
      garbleRatio: 0,
    });
  });
});
