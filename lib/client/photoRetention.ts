import type { ReceiptPhotoMeta } from "@/lib/storage/photoTypes";

export const PHOTO_FULL_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

export function shouldPurgePhotoFull(
  meta: ReceiptPhotoMeta,
  nowMs: number,
): boolean {
  if (meta.fullPurged) return false;
  if (meta.remoteSyncedAtMs == null) return false;
  return nowMs - meta.remoteSyncedAtMs >= PHOTO_FULL_RETENTION_MS;
}

export type ReceiptRetentionGuard = {
  id: string;
  pendingUpload?: boolean;
  status: string;
};

export function canPurgePhotoFullForReceipt(
  receipt: ReceiptRetentionGuard | undefined,
): boolean {
  if (!receipt) return false;
  if (receipt.pendingUpload) return false;
  if (receipt.status === "processing") return false;
  return true;
}
