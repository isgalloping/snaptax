import type { Receipt } from "@/lib/types";
import type { ReceiptVisualState } from "@/lib/ui/homeVisual";

export type ReceiptListVisualInput = Pick<Receipt, "status" | "pendingUpload">;

export function resolveReceiptListVisualState(
  receipt: ReceiptListVisualInput,
  opts: { syncStuck: boolean; uploadInFlight: boolean },
): {
  state: ReceiptVisualState;
  pill: "analyzing" | "uploading" | "paused" | "none";
} {
  if (receipt.status !== "processing") {
    return { state: "done", pill: "none" };
  }
  if (opts.syncStuck) {
    return { state: "paused", pill: "paused" };
  }
  if (receipt.pendingUpload && opts.uploadInFlight) {
    return { state: "uploading", pill: "uploading" };
  }
  return { state: "analyzing", pill: "analyzing" };
}
