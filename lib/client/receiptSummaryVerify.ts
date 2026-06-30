import { currentTaxYear } from "@/lib/tax/taxYearStats";
import { clientTimeZone } from "@/lib/time/timeZone";
import { loadAllReceipts, warmReceiptDb } from "@/lib/storage/receiptDb";
import {
  computeWatermarkFromReceipts,
  readSummaryWatermark,
  rebuildCurrentSeasonSummary,
} from "@/lib/storage/receiptSummary";
import type { ReceiptSummaryWatermark } from "@/lib/storage/receiptSummaryTypes";

export function summaryWatermarkDrifted(
  stored: ReceiptSummaryWatermark | null,
  computed: ReceiptSummaryWatermark,
): boolean {
  if (!stored) return true;
  if (stored.schemaVersion !== computed.schemaVersion) return true;
  return (
    stored.maxUpdatedAtMs !== computed.maxUpdatedAtMs ||
    stored.receiptCountInCurrentSeason !== computed.receiptCountInCurrentSeason
  );
}

export async function verifyReceiptSummaryWatermark(): Promise<"ok" | "rebuilt"> {
  const db = await warmReceiptDb();
  const receipts = await loadAllReceipts();
  const year = currentTaxYear();
  const computed = computeWatermarkFromReceipts(receipts, year, clientTimeZone());
  const stored = await readSummaryWatermark(db);
  if (!summaryWatermarkDrifted(stored, computed)) return "ok";
  await rebuildCurrentSeasonSummary(db);
  return "rebuilt";
}

export function scheduleReceiptSummaryVerify(delayMs = 30_000): void {
  if (typeof window === "undefined") return;

  const run = () => {
    void verifyReceiptSummaryWatermark().catch(() => {
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
