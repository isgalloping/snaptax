import { compressReceiptImageWithFingerprint } from "@/lib/camera/compressReceiptImage";
import { withFreshBudget } from "@/lib/client/receiptSyncBudget";
import { findLocalDuplicateBySha } from "@/lib/receipts/localDuplicate";
import {
  findReceiptIdByContentSha256,
  loadAllReceipts,
  savePhotoCompressed,
  saveReceipt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import { utcNow } from "@/lib/time/utc";

export type CapturePrepareResult =
  | { kind: "duplicate"; existingReceiptId: string }
  | { kind: "created"; receipt: StoredReceipt };

export async function prepareReceiptCapture(
  file: File,
  options?: { replaceId?: string | null; skipSave?: boolean },
): Promise<CapturePrepareResult> {
  const { blob, width, height, contentSha256 } =
    await compressReceiptImageWithFingerprint(file);

  const excludeId = options?.replaceId ?? null;
  const inMemory = await loadAllReceipts();
  const memHit = findLocalDuplicateBySha(inMemory, contentSha256, excludeId);
  if (memHit) {
    return { kind: "duplicate", existingReceiptId: memHit.id };
  }

  const idbHit = await findReceiptIdByContentSha256(contentSha256);
  if (idbHit && idbHit !== excludeId) {
    return { kind: "duplicate", existingReceiptId: idbHit };
  }

  const id = excludeId ?? crypto.randomUUID();
  const snapAt = utcNow();
  const receipt: StoredReceipt = withFreshBudget({
    id,
    status: "processing",
    merchant: "Scanning",
    timestamp: snapAt,
    updatedAt: snapAt,
    pendingUpload: true,
    contentSha256,
  });

  if (!options?.skipSave) {
    await savePhotoCompressed(id, { blob, width, height });
    await saveReceipt(receipt);
    void import("@/lib/client/emitReceiptLifecycleEvent").then(({ emitReceiptLifecycleEvent }) =>
      emitReceiptLifecycleEvent({
        receiptId: receipt.id,
        type: "RECEIPT_CREATED",
        payload: { pendingUpload: receipt.pendingUpload ?? true },
      }),
    );
  }

  return { kind: "created", receipt };
}
