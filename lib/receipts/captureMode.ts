export type ReceiptCaptureMode = "batch" | "single";

export function parseCaptureModeHeader(
  header: string | null,
): ReceiptCaptureMode {
  return header === "batch" ? "batch" : "single";
}

/** Batch flush uploads many distinct receipts — skip coarse dHash similar dedup. */
export function shouldRunSimilarDuplicateCheck(
  captureMode: ReceiptCaptureMode,
): boolean {
  return captureMode !== "batch";
}
