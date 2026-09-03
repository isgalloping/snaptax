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
import type { IncomeCaptureKind } from "@/lib/export/incomeCapture";
import { utcNow } from "@/lib/time/utc";

export type CapturePrepareResult =
  | { kind: "duplicate"; existingReceiptId: string }
  | { kind: "created"; receipt: StoredReceipt };

export type BuildPreparedReceiptOptions = {
  id: string;
  snapAt: Date;
  contentSha256: string;
  captureKind?: IncomeCaptureKind;
};

export function buildPreparedReceipt({
  id,
  snapAt,
  contentSha256,
  captureKind,
}: BuildPreparedReceiptOptions): StoredReceipt {
  return withFreshBudget({
    id,
    status: "processing",
    merchant: "Scanning",
    timestamp: snapAt,
    updatedAt: snapAt,
    pendingUpload: true,
    contentSha256,
    ...(captureKind ? { captureKind } : {}),
  });
}

export async function prepareReceiptCapture(
  file: File,
  options?: {
    replaceId?: string | null;
    skipSave?: boolean;
    captureKind?: IncomeCaptureKind;
  },
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
  const receipt = buildPreparedReceipt({
    id,
    snapAt,
    contentSha256,
    captureKind: options?.captureKind,
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
