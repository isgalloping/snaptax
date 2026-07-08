import type { Receipt } from "@/lib/types";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

export type ExportPrepareDeps = {
  flushPendingUploads: () => Promise<void>;
  flushPendingDeletes: () => Promise<void>;
  loadAllReceipts: () => Promise<StoredReceipt[]>;
  syncFromServer: (
    local: StoredReceipt[],
    mode: "immediate",
  ) => Promise<Receipt[]>;
  ensureGhostSession: () => Promise<void>;
  isOnline?: () => boolean;
};

/** Flush pending writes and sync before export so UI counts match server. */
export async function prepareExportSync(
  deps: ExportPrepareDeps,
): Promise<Receipt[]> {
  const isOnline = deps.isOnline ?? (() => navigator.onLine);
  if (!isOnline()) {
    throw new Error("EXPORT_OFFLINE");
  }

  await deps.ensureGhostSession();
  await deps.flushPendingUploads();
  await deps.flushPendingDeletes();
  const local = await deps.loadAllReceipts();
  return deps.syncFromServer(local, "immediate");
}

/** Flush pending writes and read IDB only — local-first csv/txf gate prep (no server list merge). */
export async function prepareExportLocal(
  deps: ExportPrepareDeps,
): Promise<Receipt[]> {
  const isOnline = deps.isOnline ?? (() => navigator.onLine);
  if (!isOnline()) {
    throw new Error("EXPORT_OFFLINE");
  }

  await deps.ensureGhostSession();
  await deps.flushPendingUploads();
  await deps.flushPendingDeletes();
  return deps.loadAllReceipts();
}
