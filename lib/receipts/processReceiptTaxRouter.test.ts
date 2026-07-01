import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTextClassifyResult,
  ocrDraftToStructured,
  pickReceiptTaxRoute,
} from "@/lib/receipts/processReceiptTaxRouter";
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

  it("falls back to vision for low quality local OCR drafts", () => {
    assert.equal(
      pickReceiptTaxRoute({ ...goodDraft, confidence: 0.59 }),
      "vision_fallback",
    );
    assert.equal(
      pickReceiptTaxRoute({
        ...goodDraft,
        parsed: {
          ...goodDraft.parsed,
          signals: {
            ...goodDraft.parsed.signals,
            garbleRatio: 0.51,
          },
        },
      }),
      "vision_fallback",
    );
    assert.equal(
      pickReceiptTaxRoute({ ...goodDraft, engine: "skipped" }),
      "vision_fallback",
    );
  });
});

describe("ocrDraftToStructured", () => {
  it("uses the first OCR text line as merchant and zero total when parsed fields are missing", () => {
    const structured = ocrDraftToStructured({
      ...goodDraft,
      text: "\n  ROADSIDE SUPPLY  \nTOTAL unreadable",
      parsed: {
        rawText: "",
        signals: { merchantMissing: true, totalMissing: true, garbleRatio: 0 },
      },
    });

    assert.equal(structured.merchant, "ROADSIDE SUPPLY");
    assert.equal(structured.total, 0);
    assert.equal(structured.rawText, "\n  ROADSIDE SUPPLY  \nTOTAL unreadable");
    assert.equal(structured.extractionSource, "local_ocr");
  });
});

describe("buildTextClassifyResult", () => {
  it("computes US tax amount from text classification fields", () => {
    const result = buildTextClassifyResult({
      classified: {
        region: "us",
        fields: {
          amount: 100,
          merchant: "Fuel Stop",
          category: "VEHICLE",
          deductible: true,
          deduction_ratio: 0.8,
          confidence: 0.95,
        },
      },
      dataRegion: "us",
      model: "gpt-test",
      ocrDraft: goodDraft,
      structured: ocrDraftToStructured(goodDraft),
    });

    assert.equal(result.status, "done");
    assert.equal(result.taxAmount, 20);
    assert.equal(result.merchantName, "Fuel Stop");
    assert.equal(result.category, "VEHICLE");
    assert.equal(result.aiRaw.extractionSource, "local_ocr");
    assert.equal(result.aiRaw.deductible_base, 80);
    assert.deepEqual(result.aiRaw.ocrDraft, {
      confidence: 0.9,
      engine: "tesseract",
      merchantMissing: false,
      totalMissing: false,
      garbleRatio: 0,
    });
  });

  it("computes EU tax amount and marks computed VAT when vat_amount is missing", () => {
    const result = buildTextClassifyResult({
      classified: {
        region: "eu",
        fields: {
          amount: 119,
          currency: "EUR",
          merchant: "REWE",
          category: "supplies",
          deductible: true,
          vat_rate: 0.19,
          vat_amount: null,
          confidence: 0.91,
        },
      },
      dataRegion: "eu",
      model: "gpt-test",
      ocrDraft: goodDraft,
      structured: ocrDraftToStructured(goodDraft),
    });

    assert.equal(result.status, "done");
    assert.equal(result.taxAmount, 19);
    assert.equal(result.currency, "EUR");
    assert.equal(result.aiRaw.computed_vat, true);
    assert.equal(result.aiRaw.vat_rate, 0.19);
  });

  it("returns blurry when text classification confidence is below the action threshold", () => {
    const result = buildTextClassifyResult({
      classified: {
        region: "us",
        fields: {
          amount: 100,
          merchant: "Fuel Stop",
          category: "VEHICLE",
          deductible: true,
          deduction_ratio: 1,
          confidence: 0.49,
        },
      },
      dataRegion: "us",
      model: "gpt-test",
      ocrDraft: goodDraft,
      structured: ocrDraftToStructured(goodDraft),
    });

    assert.equal(result.status, "blurry");
    assert.equal(result.taxAmount, 0);
    assert.equal(result.currency, "USD");
    assert.equal(result.aiRaw.extractionSource, "local_ocr");
    assert.equal(result.aiRaw.lowConfidence, true);
  });
});
