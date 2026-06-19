import { apiReceiptToLocal } from "@/lib/client/receiptApi";
import {
  reconcileServerPrimaryPhotos,
  saveReceipt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import type { Receipt } from "@/lib/types";

export const STARTUP_UNFILED_LIMIT = 30;
export const UI_RECEIPT_LIMIT = 100;
export const RECEIPT_SYNC_LIMIT = UI_RECEIPT_LIMIT;

export function receiptUpdatedAt(receipt: Pick<Receipt, "updatedAt" | "timestamp">): Date {
  return receipt.updatedAt ?? receipt.timestamp;
}

export function top100ByUpdatedAt(receipts: StoredReceipt[]): StoredReceipt[] {
  return [...receipts]
    .sort(
      (a, b) =>
        receiptUpdatedAt(b).getTime() - receiptUpdatedAt(a).getTime(),
    )
    .slice(0, RECEIPT_SYNC_LIMIT);
}

function isRemoteNewer(
  remoteUpdatedAt: Date | undefined,
  localUpdatedAt: Date,
): boolean {
  if (!remoteUpdatedAt) return false;
  return remoteUpdatedAt.getTime() > localUpdatedAt.getTime();
}

function backfillExtractionFromRemote(
  local: StoredReceipt,
  remote: StoredReceipt,
): StoredReceipt {
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

  if (Object.keys(patch).length === 0) return local;
  return { ...local, ...patch };
}

export function unionMergeLWW(
  local: StoredReceipt[],
  remote: Receipt[],
): StoredReceipt[] {
  const byId = new Map<string, StoredReceipt>();

  for (const row of local) {
    byId.set(row.id, row);
  }

  for (const remoteRow of remote) {
    const existing = byId.get(remoteRow.id);
    const remoteStored: StoredReceipt = {
      ...(existing ?? {}),
      ...remoteRow,
      timestamp: remoteRow.timestamp,
      updatedAt: remoteRow.updatedAt ?? remoteRow.timestamp,
      taxSeason: remoteRow.taxSeason ?? existing?.taxSeason,
      taxSeasonDate: remoteRow.taxSeasonDate ?? existing?.taxSeasonDate,
      hasRemoteImage: remoteRow.hasRemoteImage ?? existing?.hasRemoteImage,
      pendingUpload: false,
      writeBudgetRemaining: existing?.writeBudgetRemaining,
    };

    if (!existing) {
      byId.set(remoteRow.id, remoteStored);
      continue;
    }

    if (existing.pendingUpload) continue;

    const localUpdatedAt = receiptUpdatedAt(existing);
    const remoteUpdatedAt = remoteRow.updatedAt ?? remoteRow.timestamp;
    if (isRemoteNewer(remoteUpdatedAt, localUpdatedAt)) {
      byId.set(remoteRow.id, remoteStored);
    } else {
      byId.set(
        remoteRow.id,
        backfillExtractionFromRemote(existing, remoteStored),
      );
    }
  }

  return [...byId.values()];
}

export async function persistMergedReceipts(
  merged: StoredReceipt[],
  local: StoredReceipt[],
): Promise<void> {
  const localById = new Map(local.map((r) => [r.id, r]));
  for (const row of merged) {
    const existing = localById.get(row.id);
    const stored: StoredReceipt = {
      ...(existing ?? {}),
      ...row,
      timestamp: row.timestamp,
      updatedAt: row.updatedAt ?? row.timestamp,
      pendingUpload: Boolean(row.pendingUpload),
      writeBudgetRemaining:
        row.writeBudgetRemaining ?? existing?.writeBudgetRemaining,
    };

    const unchanged =
      existing &&
      existing.status === stored.status &&
      existing.pendingUpload === stored.pendingUpload &&
      existing.taxAmount === stored.taxAmount &&
      existing.merchant === stored.merchant &&
      existing.taxSeason === stored.taxSeason &&
      existing.taxSeasonDate?.getTime() === stored.taxSeasonDate?.getTime() &&
      existing.hasRemoteImage === stored.hasRemoteImage &&
      receiptUpdatedAt(existing).getTime() ===
        receiptUpdatedAt(stored).getTime();

    if (!unchanged) {
      await saveReceipt(stored);
    }
  }
  await reconcileServerPrimaryPhotos(merged);
}

export function remoteReceiptsToLocal(
  remote: Parameters<typeof apiReceiptToLocal>[0][],
): Receipt[] {
  return remote.map(apiReceiptToLocal);
}
