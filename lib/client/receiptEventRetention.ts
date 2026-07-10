import { pruneSyncedReceiptEvents } from "@/lib/storage/receiptEventQueue";

export function scheduleReceiptEventRetentionPrune(delayMs = 45_000): void {
  if (typeof window === "undefined") return;

  const run = () => {
    void pruneSyncedReceiptEvents().catch(() => {
      // idle best-effort
    });
  };

  if ("requestIdleCallback" in window) {
    window.setTimeout(() => {
      window.requestIdleCallback(() => run(), { timeout: 60_000 });
    }, delayMs);
    return;
  }

  globalThis.setTimeout(run, delayMs);
}
