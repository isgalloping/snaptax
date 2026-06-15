import { deleteReceiptRemote } from "@/lib/client/receiptApi";
import {
  addDeletedReceiptId,
  readDeletedReceiptIds,
  removeDeletedReceiptId,
} from "@/lib/client/receiptDeleteTombstones";
import { ensureGhostSession } from "@/lib/client/ghostClient";
import { isPersistedReceiptId } from "@/lib/receipts/receiptId";
import {
  deleteReceipt as deleteStoredReceipt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";

export type DeleteReceiptFlowDeps = {
  isOnline?: () => boolean;
  ensureGhostSession?: () => Promise<void>;
  addTombstone?: (id: string) => Promise<void>;
  removeTombstone?: (id: string) => Promise<void>;
  deleteLocal?: (id: string) => Promise<void>;
  deleteRemote?: (id: string) => Promise<void>;
  readTombstones?: () => Promise<Set<string>>;
};

export async function tombstonePersistedReceipt(id: string): Promise<void> {
  if (!isPersistedReceiptId(id)) return;
  await addDeletedReceiptId(id);
}

export async function clearTombstoneAfterRemoteDelete(id: string): Promise<void> {
  if (!isPersistedReceiptId(id)) return;
  await removeDeletedReceiptId(id);
}

export async function deleteReceiptLocalAndRemote(
  id: string,
  deps: DeleteReceiptFlowDeps = {},
): Promise<void> {
  const isOnline =
    deps.isOnline ??
    (() => typeof navigator !== "undefined" && navigator.onLine);
  const ensureGhost =
    deps.ensureGhostSession ?? (() => ensureGhostSession());
  const addTombstone = deps.addTombstone ?? addDeletedReceiptId;
  const removeTombstone = deps.removeTombstone ?? removeDeletedReceiptId;
  const deleteLocal = deps.deleteLocal ?? deleteStoredReceipt;
  const deleteRemote = deps.deleteRemote ?? deleteReceiptRemote;

  if (isPersistedReceiptId(id)) {
    await addTombstone(id);
  }

  await deleteLocal(id);

  if (!isOnline()) return;

  try {
    await ensureGhost();
    await deleteRemote(id);
    await removeTombstone(id);
  } catch {
    // Tombstone remains for flushPendingDeletes
  }
}

export async function flushPendingDeletes(
  deps: DeleteReceiptFlowDeps = {},
): Promise<void> {
  const readTombstones = deps.readTombstones ?? readDeletedReceiptIds;
  const tombstones = await readTombstones();
  if (tombstones.size === 0) return;

  const isOnline =
    deps.isOnline ??
    (() => typeof navigator !== "undefined" && navigator.onLine);
  if (!isOnline()) return;

  const ensureGhost =
    deps.ensureGhostSession ?? (() => ensureGhostSession());
  const removeTombstone = deps.removeTombstone ?? removeDeletedReceiptId;
  const deleteRemote = deps.deleteRemote ?? deleteReceiptRemote;

  try {
    await ensureGhost();
  } catch {
    return;
  }

  for (const id of tombstones) {
    try {
      await deleteRemote(id);
      await removeTombstone(id);
    } catch {
      // Retry on next flush
    }
  }
}

export async function pruneLocalSyncedAbsentFromRemote(
  local: StoredReceipt[],
  remoteIds: ReadonlySet<string>,
  deleteLocal: (id: string) => Promise<void> = deleteStoredReceipt,
): Promise<void> {
  for (const row of local) {
    if (row.pendingUpload) continue;
    if (!isPersistedReceiptId(row.id)) continue;
    if (remoteIds.has(row.id)) continue;
    await deleteLocal(row.id);
  }
}
