import type { StoredReceipt } from "@/lib/storage/receiptDb";
import { isSyncStuck } from "@/lib/client/receiptSyncBudget";
import { isIncomeFormType } from "@/lib/export/incomeDocuments";
import type { IncomeCaptureKind } from "@/lib/export/incomeCapture";

export function applyPhotoMissingState<T extends StoredReceipt>(receipt: T): T {
  return {
    ...receipt,
    photoMissing: true,
    writeBudgetRemaining: 0,
    pendingUpload: true,
  };
}

export function isPhotoMissingUpload(
  receipt: Pick<StoredReceipt, "photoMissing" | "pendingUpload">,
): boolean {
  return receipt.pendingUpload === true && receipt.photoMissing === true;
}

export function shouldSkipUploadAttempt(receipt: StoredReceipt): boolean {
  return isSyncStuck(receipt) || isPhotoMissingUpload(receipt);
}

export function captureKindForUpload(
  receipt: Pick<StoredReceipt, "captureKind" | "category">,
): IncomeCaptureKind | null {
  if (receipt.captureKind) return receipt.captureKind;
  const category = receipt.category?.toUpperCase().trim();
  return isIncomeFormType(category) ? category : null;
}
