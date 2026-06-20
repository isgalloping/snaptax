import { apiReceiptToLocal, fetchReceiptById } from "@/lib/client/receiptApi";
import { getBudget } from "@/lib/client/receiptSyncBudget";
import {
  deleteReceipt as deleteStoredReceipt,
  markRemoteSyncedPhotos,
  saveReceipt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";

export async function reconcileDuplicateReceipt(
  localId: string,
  existingReceiptId: string,
  prior?: StoredReceipt,
): Promise<StoredReceipt> {
  const remote = await fetchReceiptById(existingReceiptId);
  const updated: StoredReceipt = {
    ...apiReceiptToLocal(remote),
    hasRemoteImage: true,
    pendingUpload: false,
    writeBudgetRemaining: prior ? getBudget(prior) : 5,
    photoMissing: undefined,
  };
  if (localId !== existingReceiptId) {
    await deleteStoredReceipt(localId);
  }
  await saveReceipt(updated);
  await markRemoteSyncedPhotos([updated.id]);
  return updated;
}
