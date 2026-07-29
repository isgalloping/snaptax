import { isReceiptFiled } from "@/lib/receipts/filedStatus";
import type { StoredReceipt } from "@/lib/storage/receiptDb";
import type { Receipt } from "@/lib/types";

function rowUpdatedAt(receipt: Pick<Receipt, "updatedAt" | "timestamp">): Date {
  return receipt.updatedAt ?? receipt.timestamp;
}

export function isDoneLockedReceipt(
  receipt: Pick<StoredReceipt, "status">,
): boolean {
  return receipt.status === "done";
}

function applyFiledMetadataMerge(
  target: StoredReceipt,
  local: StoredReceipt,
  remote: StoredReceipt,
): void {
  if (!isReceiptFiled(remote)) return;
  if (!isReceiptFiled(local)) {
    target.taxSeason = remote.taxSeason;
    target.taxSeasonDate = remote.taxSeasonDate;
    return;
  }
  const remoteMs = remote.taxSeasonDate?.getTime() ?? 0;
  const localMs = local.taxSeasonDate?.getTime() ?? 0;
  if (remoteMs > localMs) {
    target.taxSeason = remote.taxSeason;
    target.taxSeasonDate = remote.taxSeasonDate;
  }
}

/** Local `done` row wins protected fields; remote may update filed + sync metadata. */
export function mergeDoneLockedLocalRow(
  local: StoredReceipt,
  remote: StoredReceipt,
): StoredReceipt {
  const merged: StoredReceipt = {
    ...local,
    pendingUpload: false,
    writeBudgetRemaining: local.writeBudgetRemaining,
  };

  if (remote.hasRemoteImage === true) {
    merged.hasRemoteImage = true;
  }

  applyFiledMetadataMerge(merged, local, remote);

  if (!local.pendingUpload && isReceiptFiled(remote)) {
    const remoteUpdated = rowUpdatedAt(remote);
    const localUpdated = rowUpdatedAt(local);
    if (remoteUpdated.getTime() > localUpdated.getTime()) {
      merged.updatedAt = remote.updatedAt ?? remote.timestamp;
    }
  }

  return merged;
}

/** When local is newer than remote, backfill only allowed fields. */
export function backfillAllowedFieldsFromRemote(
  local: StoredReceipt,
  remote: StoredReceipt,
): StoredReceipt {
  if (isDoneLockedReceipt(local)) {
    const merged = { ...local };
    applyFiledMetadataMerge(merged, local, remote);
    if (remote.hasRemoteImage === true) {
      merged.hasRemoteImage = true;
    }
    return merged;
  }

  if (remote.status !== "done" && remote.status !== "blurry") {
    return local;
  }

  const patch: Partial<StoredReceipt> = {};
  if (!local.merchant?.trim() && remote.merchant?.trim()) {
    patch.merchant = remote.merchant;
  }
  if (local.amount == null && remote.amount != null) {
    patch.amount = remote.amount;
  }
  if (!local.category?.trim() && remote.category?.trim()) {
    patch.category = remote.category;
  }
  if (!local.currency && remote.currency) {
    patch.currency = remote.currency;
  }
  if (local.deductible === undefined && remote.deductible !== undefined) {
    patch.deductible = remote.deductible;
  }
  if (local.incomeTaxYear == null && remote.incomeTaxYear != null) {
    patch.incomeTaxYear = remote.incomeTaxYear;
  }
  if (!isReceiptFiled(local) && isReceiptFiled(remote)) {
    patch.taxSeason = remote.taxSeason;
    patch.taxSeasonDate = remote.taxSeasonDate;
  }

  if (Object.keys(patch).length === 0) return local;
  return { ...local, ...patch };
}
