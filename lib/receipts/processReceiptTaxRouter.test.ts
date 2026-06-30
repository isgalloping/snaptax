import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pickReceiptTaxRoute } from "@/lib/receipts/processReceiptTaxRouter";
import type { OcrDraftPayload } from "@/lib/ocr/types";

const goodDraft: OcrDraftPayload = {
  text: "STORE\nTOTAL $12.00",
  confidence: 0.9,
  engine: "tesseract",
  preprocessVersion: 1,
  parsed: {
    rawText: "STORE\nTOTAL $12.00",
    merchant: "STORE",
    total: 12,
    signals: { merchantMissing: false, totalMissing: false, garbleRatio: 0 },
  },
};

describe("pickReceiptTaxRoute", () => {
  it("uses text classify when ocrDraft passes gate", () => {
    assert.equal(pickReceiptTaxRoute(goodDraft), "text_classify");
  });

  it("falls back to vision without draft or mock", () => {
    assert.equal(pickReceiptTaxRoute(null), "vision_fallback");
    assert.equal(pickReceiptTaxRoute(goodDraft, true), "vision_fallback");
  });
});
