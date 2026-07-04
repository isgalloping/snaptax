import {
  apiReceiptToLocal,
  fetchReceiptsReconcile,
  type ApiReceipt,
} from "@/lib/client/receiptApi";
import { receiptUpdatedAt } from "@/lib/client/receiptSync";
import { isPersistedReceiptId } from "@/lib/receipts/receiptId";
import { rebuildCurrentSeasonSummary } from "@/lib/storage/receiptSummary";
import {
  loadAllReceipts,
  saveReceipt,
  warmReceiptDb,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";

export const NON_DONE_RECONCILE_LIMIT = 50;

export function reconcileFieldsDiffer(
  local: StoredReceipt,
  serverLocal: ReturnType<typeof apiReceiptToLocal>,
): boolean {
  return (
    local.status !== serverLocal.status ||
    local.amount !== serverLocal.amount ||
    local.taxAmount !== serverLocal.taxAmount ||
    (local.merchant ?? "") !== (serverLocal.merchant ?? "") ||
    (local.category ?? "") !== (serverLocal.category ?? "")
  );
}

function mergeServerIntoLocal(
  existing: StoredReceipt,
  serverRow: ApiReceipt,
): StoredReceipt {
  const fromServer = apiReceiptToLocal(serverRow);
  return {
    ...existing,
    ...fromServer,
    pendingUpload: false,
    writeBudgetRemaining: existing.writeBudgetRemaining,
    ocrDraft: existing.ocrDraft,
    photoMissing: existing.photoMissing,
    contentSha256: existing.contentSha256,
    hasRemoteImage: fromServer.hasRemoteImage ?? existing.hasRemoteImage,
  };
}

export type ReconcileNonDoneDeps = {
  loadAllReceipts?: typeof loadAllReceipts;
  fetchReconcile?: (ids: string[]) => Promise<{ receipts: ApiReceipt[] }>;
  saveReceipt?: typeof saveReceipt;
  rebuildSummary?: (db: IDBDatabase) => Promise<unknown>;
  warmReceiptDb?: typeof warmReceiptDb;
};

export async function reconcileNonDoneWindow(
  deps: ReconcileNonDoneDeps = {},
): Promise<number> {
  const loadReceipts = deps.loadAllReceipts ?? loadAllReceipts;
  const fetchReconcile = deps.fetchReconcile ?? fetchReceiptsReconcile;
  const persist = deps.saveReceipt ?? saveReceipt;
  const warmDb = deps.warmReceiptDb ?? warmReceiptDb;
  const rebuildSummary = deps.rebuildSummary ?? rebuildCurrentSeasonSummary;

  const local = await loadReceipts();
  const localById = new Map(local.map((r) => [r.id, r]));

  const ids = local
    .filter((r) => r.status !== "done" && isPersistedReceiptId(r.id))
    .sort(
      (a, b) =>
        receiptUpdatedAt(b).getTime() - receiptUpdatedAt(a).getTime(),
    )
    .slice(0, NON_DONE_RECONCILE_LIMIT)
    .map((r) => r.id);

  if (ids.length === 0) return 0;

  const { receipts: serverRows } = await fetchReconcile(ids);
  let updatedCount = 0;

  for (const serverRow of serverRows) {
    const existing = localById.get(serverRow.id);
    if (!existing || existing.pendingUpload) continue;

    const serverLocal = apiReceiptToLocal(serverRow);
    if (!reconcileFieldsDiffer(existing, serverLocal)) continue;

    await persist(mergeServerIntoLocal(existing, serverRow));
    updatedCount++;
  }

  if (updatedCount > 0) {
    const db = await warmDb();
    await rebuildSummary(db);
  }

  return updatedCount;
}
