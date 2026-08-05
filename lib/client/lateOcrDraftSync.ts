import { shouldUseVisionFallback } from "@/lib/ocr/qualityGate";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

/** Upload finished before local OCR — server row still processing with a usable draft. */
export function shouldSubmitLateOcrDraft(
  receipt: Pick<
    StoredReceipt,
    "hasRemoteImage" | "pendingUpload" | "status" | "ocrDraft"
  >,
): boolean {
  if (!receipt.hasRemoteImage || receipt.pendingUpload) return false;
  if (receipt.status !== "processing") return false;
  const draft = receipt.ocrDraft;
  if (!draft || draft.engine === "skipped") return false;
  if (shouldUseVisionFallback(draft)) return false;
  return true;
}
