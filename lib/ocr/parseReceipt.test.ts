import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ocrDraftFromAiRaw } from "@/lib/ocr/ocrDraftSchema";
import { parseReceipt } from "@/lib/ocr/parseReceipt";
import { shouldUseVisionFallback } from "@/lib/ocr/qualityGate";
import type { OcrDraftPayload } from "@/lib/ocr/types";

const FIXTURES: Array<{
  name: string;
  text: string;
  expect: {
    merchant?: string;
    total?: number;
    date?: string;
    merchantMissing?: boolean;
    totalMissing?: boolean;
  };
}> = [
  {
    name: "US Home Depot",
    text: `HOME DEPOT #1234
01/15/2026
SUBTOTAL $42.00
TAX $3.36
TOTAL $45.36`,
    expect: { merchant: "HOME DEPOT", total: 45.36, date: "01/15/2026" },
  },
  {
    name: "US Shell gas",
    text: "SHELL GASOLINE PURCHASE\nTOTAL $72.14",
    expect: { merchant: "SHELL GASOLINE PURCHASE", total: 72.14 },
  },
  {
    name: "US Walmart",
    text: "WALMART STORE\n03/02/2026\nTOTAL $45.22",
    expect: { merchant: "WALMART STORE", total: 45.22, date: "03/02/2026" },
  },
  {
    name: "US amount due",
    text: "LOWES\nAMOUNT DUE $128.50",
    expect: { merchant: "LOWES", total: 128.5 },
  },
  {
    name: "US balance due",
    text: "ACE HARDWARE\nBALANCE DUE $19.99",
    expect: { merchant: "ACE HARDWARE", total: 19.99 },
  },
  {
    name: "US grand total",
    text: "COSTCO\nGRAND TOTAL $200.00",
    expect: { merchant: "COSTCO", total: 200 },
  },
  {
    name: "US max money fallback",
    text: "MYSTERY SHOP\nItem $10.00\nTip $2.00\n$55.00",
    expect: { merchant: "MYSTERY SHOP", total: 55 },
  },
  {
    name: "EU REWE TTC",
    text: `REWE MARKT
15.03.2026
NETTO 12,40
TTC 14,80`,
    expect: {
      merchant: "REWE MARKT",
      total: 14.8,
      date: "15.03.2026",
    },
  },
  {
    name: "EU Carrefour",
    text: "CARREFOUR\n22/01/2026\nTOTAL €32,15",
    expect: { merchant: "CARREFOUR", total: 32.15, date: "22/01/2026" },
  },
  {
    name: "EU Aldi GESAMT",
    text: "ALDI\nGESAMT 8,99",
    expect: { merchant: "ALDI", total: 8.99 },
  },
  {
    name: "EU SUMME",
    text: "LIDL\nSUMME 15,40",
    expect: { merchant: "LIDL", total: 15.4 },
  },
  {
    name: "EU to pay",
    text: "TESCO\nTO PAY £12.50",
    expect: { merchant: "TESCO", total: 12.5 },
  },
  {
    name: "noise only",
    text: "\n\n***\n",
    expect: { merchantMissing: true, totalMissing: true },
  },
  {
    name: "phone line skipped",
    text: "(555) 123-4567\nSTARBUCKS\nTOTAL $6.75",
    expect: { merchant: "STARBUCKS", total: 6.75 },
  },
  {
    name: "date-only top line skipped",
    text: "01/01/2026\nTARGET\nTOTAL $22.00",
    expect: { merchant: "TARGET", total: 22, date: "01/01/2026" },
  },
  {
    name: "US thousands separator",
    text: "FLEET FARM\nTOTAL $1,234.56",
    expect: { merchant: "FLEET FARM", total: 1234.56 },
  },
  {
    name: "merchant hash stripped",
    text: "MCDONALD'S #8821\nTOTAL $12.00",
    expect: { merchant: "MCDONALD'S", total: 12 },
  },
  {
    name: "total line last wins",
    text: "STORE\nSUBTOTAL $10\nTAX $1\nTOTAL $11.00",
    expect: { merchant: "STORE", total: 11 },
  },
  {
    name: "empty text",
    text: "",
    expect: { merchantMissing: true, totalMissing: true },
  },
  {
    name: "garbled but has total",
    text: "@@@ SHOP @@@\nTOTAL $5.00",
    expect: { merchant: "@@@ SHOP @@@", total: 5 },
  },
  {
    name: "dollar without label",
    text: "LOCAL MART\n$18.25",
    expect: { merchant: "LOCAL MART", total: 18.25 },
  },
  {
    name: "EU dotted date header",
    text: "DM\n12.05.2025\nTTC 9,99",
    expect: { merchant: "DM", total: 9.99, date: "12.05.2025" },
  },
];

describe("parseReceipt fixtures", () => {
  for (const fx of FIXTURES) {
    it(fx.name, () => {
      const parsed = parseReceipt(fx.text);
      if (fx.expect.merchant != null) {
        assert.equal(parsed.merchant, fx.expect.merchant);
      }
      if (fx.expect.total != null) {
        assert.equal(parsed.total, fx.expect.total);
      }
      if (fx.expect.date != null) {
        assert.equal(parsed.date, fx.expect.date);
      }
      if (fx.expect.merchantMissing != null) {
        assert.equal(parsed.signals.merchantMissing, fx.expect.merchantMissing);
      }
      if (fx.expect.totalMissing != null) {
        assert.equal(parsed.signals.totalMissing, fx.expect.totalMissing);
      }
    });
  }
});

describe("shouldUseVisionFallback", () => {
  const base: OcrDraftPayload = {
    text: "x",
    confidence: 0.9,
    engine: "tesseract",
    preprocessVersion: 1,
    parsed: {
      rawText: "x",
      merchant: "Store",
      total: 10,
      signals: { merchantMissing: false, totalMissing: false, garbleRatio: 0 },
    },
  };

  it("requires vision when draft missing or low confidence", () => {
    assert.equal(shouldUseVisionFallback(null), true);
    assert.equal(
      shouldUseVisionFallback({ ...base, confidence: 0.5 }),
      true,
    );
    assert.equal(
      shouldUseVisionFallback({ ...base, engine: "skipped" }),
      true,
    );
  });

  it("allows text path when gate passes", () => {
    assert.equal(shouldUseVisionFallback(base), false);
  });
});

describe("ocrDraftFromAiRaw", () => {
  it("restores garbleRatio from summary or recomputes from rawText", () => {
    const garbled = "***\n";
    const fromSummary = ocrDraftFromAiRaw({
      rawText: "STORE\nTOTAL $1",
      ocrDraft: {
        confidence: 0.9,
        engine: "tesseract",
        merchantMissing: false,
        totalMissing: false,
        garbleRatio: 0.55,
      },
    });
    assert.ok(fromSummary);
    assert.equal(fromSummary.parsed.signals.garbleRatio, 0.55);
    assert.equal(shouldUseVisionFallback(fromSummary), true);

    const recomputed = ocrDraftFromAiRaw({
      rawText: garbled,
      ocrDraft: {
        confidence: 0.9,
        engine: "tesseract",
        merchantMissing: true,
        totalMissing: true,
      },
    });
    assert.ok(recomputed);
    assert.ok(recomputed.parsed.signals.garbleRatio >= 0);
  });
});
