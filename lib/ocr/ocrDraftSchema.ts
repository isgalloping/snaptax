import { z } from "zod";
import { parseReceipt } from "@/lib/ocr/parseReceipt";
import type { OcrDraftPayload } from "@/lib/ocr/types";

const ParsedSignalsSchema = z.object({
  merchantMissing: z.boolean(),
  totalMissing: z.boolean(),
  garbleRatio: z.number(),
});

const ParsedReceiptDraftSchema = z.object({
  merchant: z.string().optional(),
  date: z.string().optional(),
  total: z.number().optional(),
  tax: z.number().optional(),
  rawText: z.string(),
  signals: ParsedSignalsSchema,
});

export const OcrDraftPayloadSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
  parsed: ParsedReceiptDraftSchema,
  engine: z.enum(["onnx", "tesseract", "skipped"]),
  preprocessVersion: z.union([z.literal(1), z.literal(2)]),
});

export function parseOcrDraftJson(raw: string): OcrDraftPayload | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = OcrDraftPayloadSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function summarizeOcrDraftForAiRaw(
  draft: OcrDraftPayload,
): Record<string, unknown> {
  return {
    confidence: draft.confidence,
    engine: draft.engine,
    merchantMissing: draft.parsed.signals.merchantMissing,
    totalMissing: draft.parsed.signals.totalMissing,
    garbleRatio: draft.parsed.signals.garbleRatio,
  };
}

/** Restore minimal draft from persisted ai_raw for /process retry. */
export function ocrDraftFromAiRaw(
  aiRaw: unknown,
): OcrDraftPayload | null {
  if (!aiRaw || typeof aiRaw !== "object") return null;
  const row = aiRaw as Record<string, unknown>;
  const summary = row.ocrDraft;
  if (!summary || typeof summary !== "object") return null;
  const s = summary as Record<string, unknown>;
  const confidence = typeof s.confidence === "number" ? s.confidence : 0;
  const engine =
    s.engine === "tesseract" || s.engine === "onnx" || s.engine === "skipped"
      ? s.engine
      : "skipped";
  const text = typeof row.rawText === "string" ? row.rawText : "";
  const garbleRatio =
    typeof s.garbleRatio === "number"
      ? s.garbleRatio
      : parseReceipt(text).signals.garbleRatio;
  return {
    text,
    confidence,
    engine,
    preprocessVersion: 1,
    parsed: {
      rawText: text,
      signals: {
        merchantMissing: s.merchantMissing === true,
        totalMissing: s.totalMissing === true,
        garbleRatio,
      },
    },
  };
}
