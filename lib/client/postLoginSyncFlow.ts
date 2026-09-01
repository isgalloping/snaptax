import type { StoredReceipt } from "@/lib/storage/receiptDb";
import type { Receipt } from "@/lib/types";
import { assertCompleteSyncAvailable } from "@/lib/client/receiptSyncOrchestrator";

type CompleteSyncOpts = { requireComplete: true };

export type PostLoginSyncDeps = {
  isOnline: () => boolean;
  ensureGhostSession: () => Promise<unknown>;
  mergeOrphanGhostsOnLogin: () => Promise<unknown>;
  flushPendingUploads: () => Promise<unknown>;
  flushPendingDeletes: () => Promise<unknown>;
  flushReceiptEventBatch: (opts: { force: true }) => Promise<unknown>;
  loadAllReceipts: () => Promise<StoredReceipt[]>;
  syncFromServer: (
    local: StoredReceipt[],
    mode: "immediate",
    opts: CompleteSyncOpts,
  ) => Promise<Receipt[]>;
  pollTaxRecalc: (
    taxRecalcQueued: number,
    onTick: () => Promise<void>,
  ) => Promise<void>;
  onInitialMerge?: (merged: Receipt[]) => void;
};

export async function runPostLoginSync(
  taxRecalcQueued: number,
  deps: PostLoginSyncDeps,
): Promise<{ initialMerged: Receipt[] }> {
  assertCompleteSyncAvailable(deps.isOnline(), { requireComplete: true });
  try {
    await deps.ensureGhostSession();
  } catch {
    throw new Error("FETCH_RECEIPT_SYNC_FAILED");
  }

  await deps.mergeOrphanGhostsOnLogin();
  await deps.flushPendingUploads();
  await deps.flushPendingDeletes();
  try {
    await deps.flushReceiptEventBatch({ force: true });
  } catch {
    // Event sync is best-effort; receipt merge must still run after login.
  }

  const stored = await deps.loadAllReceipts();
  const initialMerged = await deps.syncFromServer(stored, "immediate", {
    requireComplete: true,
  });
  deps.onInitialMerge?.(initialMerged);

  if (taxRecalcQueued > 0) {
    await deps.pollTaxRecalc(taxRecalcQueued, async () => {
      const latest = await deps.loadAllReceipts();
      await deps.syncFromServer(latest, "immediate", {
        requireComplete: true,
      });
    });
  }

  return { initialMerged };
}
