import { flushReceiptEventBatch } from "@/lib/client/flushReceiptEventBatch";
import { appendReceiptEvent } from "@/lib/storage/receiptEventQueue";
import type { ReceiptEventInput } from "@/lib/storage/receiptEventTypes";

let flushScheduled = false;

function scheduleReceiptEventFlush(cameraOpen = false): void {
  if (typeof window === "undefined") return;
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(() => {
    flushScheduled = false;
    void flushReceiptEventBatch({ cameraOpen }).catch(() => {
      // best-effort; events stay pending for retry
    });
  });
}

/** Append lifecycle event locally and best-effort flush when online. */
export async function emitReceiptLifecycleEvent(
  input: ReceiptEventInput,
  options?: { cameraOpen?: boolean; skipFlush?: boolean },
): Promise<void> {
  if (typeof window === "undefined") return;
  await appendReceiptEvent(input);
  if (!options?.skipFlush) {
    scheduleReceiptEventFlush(options?.cameraOpen ?? false);
  }
}
