import {
  deleteReceipt,
  loadAllReceipts,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";

export const RECEIPT_RETENTION_MONTHS = 18;

export function receiptRetentionCutoff(now: Date): Date {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - RECEIPT_RETENTION_MONTHS);
  return cutoff;
}

export function shouldPruneReceipt(
  receipt: Pick<StoredReceipt, "timestamp" | "pendingUpload">,
  cutoff: Date,
): boolean {
  if (receipt.pendingUpload) return false;
  return receipt.timestamp < cutoff;
}

export type ReceiptRetentionDeps = {
  loadAllReceipts: typeof loadAllReceipts;
  deleteReceipt: typeof deleteReceipt;
};

const defaultDeps: ReceiptRetentionDeps = {
  loadAllReceipts,
  deleteReceipt,
};

export async function pruneReceiptsOlderThanRetention(
  now = new Date(),
  deps: ReceiptRetentionDeps = defaultDeps,
): Promise<number> {
  const cutoff = receiptRetentionCutoff(now);
  const rows = await deps.loadAllReceipts();
  let pruned = 0;

  for (const row of rows) {
    if (!shouldPruneReceipt(row, cutoff)) continue;
    await deps.deleteReceipt(row.id);
    pruned += 1;
  }

  return pruned;
}

/** Tombstones have no timestamps; skip until we can date them. */
export async function pruneStaleTombstones(_cutoff: Date): Promise<number> {
  return 0;
}

export function scheduleReceiptRetentionPrune(delayMs = 30_000): void {
  if (typeof window === "undefined") return;

  const run = () => {
    void pruneReceiptsOlderThanRetention().catch(() => {
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
