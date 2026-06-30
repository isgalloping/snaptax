import {
  loadAllReceipts,
  readSystemMeta,
  writeSystemMeta,
} from "@/lib/storage/receiptDb";

export const CLOUD_RESTORE_ATTEMPTED_KEY = "cloud_restore_attempted";

export type ShouldAutoRestoreDeps = {
  loadAllReceipts?: typeof loadAllReceipts;
  readSystemMeta?: typeof readSystemMeta;
  isOnline?: () => boolean;
};

export async function shouldAutoRestoreFromCloud(
  deps: ShouldAutoRestoreDeps = {},
): Promise<boolean> {
  const loadReceipts = deps.loadAllReceipts ?? loadAllReceipts;
  const readMeta = deps.readSystemMeta ?? readSystemMeta;
  const isOnline =
    deps.isOnline ??
    (() => typeof navigator !== "undefined" && navigator.onLine);

  const receipts = await loadReceipts();
  if (receipts.length > 0) return false;
  const attempted = await readMeta<string>(CLOUD_RESTORE_ATTEMPTED_KEY);
  if (attempted === "1") return false;
  if (!isOnline()) return false;
  return true;
}

export async function markCloudRestoreAttempted(result?: {
  restoredCount: number;
}): Promise<void> {
  if (result && result.restoredCount <= 0) return;
  await writeSystemMeta(CLOUD_RESTORE_ATTEMPTED_KEY, "1");
}
