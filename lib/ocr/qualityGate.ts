import type { OcrDraftPayload } from "@/lib/ocr/types";

export function shouldUseVisionFallback(
  draft: OcrDraftPayload | null | undefined,
): boolean {
  if (!draft) return true;
  if (draft.engine === "skipped") return true;
  if (draft.confidence < 0.6) return true;
  if (draft.parsed.signals.merchantMissing) return true;
  if (draft.parsed.signals.totalMissing) return true;
  if (draft.parsed.signals.garbleRatio > 0.5) return true;
  return false;
}
