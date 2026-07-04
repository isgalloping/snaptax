import { shouldSkipUploadAttempt } from "@/lib/client/receiptUploadFlow";
import { loadAllReceipts, type StoredReceipt } from "@/lib/storage/receiptDb";

const MS_PER_UPLOAD_ATTEMPT = 45_000;
const FLUSH_MIN_MS = 180_000;

/** @deprecated Used only for flush deadline sizing; not an OCR wait. */
export function computeBatchOcrWaitTimeoutMs(
  receiptCount: number,
  skipLocalOcr: boolean,
): number {
  if (receiptCount <= 0 || skipLocalOcr) return 0;
  return Math.max(FLUSH_MIN_MS, receiptCount * MS_PER_UPLOAD_ATTEMPT);
}

function sessionRow(
  stored: StoredReceipt[],
  id: string,
): StoredReceipt | undefined {
  return stored.find((r) => r.id === id);
}

function sessionStillPendingUpload(
  stored: StoredReceipt[],
  sessionIds: readonly string[],
): string[] {
  return sessionIds.filter((id) => {
    const row = sessionRow(stored, id);
    return row?.pendingUpload && !shouldSkipUploadAttempt(row);
  });
}

/**
 * Flush uploads for a batch session until all session receipts leave pendingUpload
 * (or timeout). Retries on upload budget / network only — not local OCR.
 */
export async function flushSessionPendingUploads(
  sessionIds: readonly string[],
  flush: () => Promise<void>,
  opts?: { maxMs?: number },
): Promise<void> {
  const ids = [...new Set(sessionIds)];
  if (ids.length === 0) return;

  const maxMs =
    opts?.maxMs ??
    Math.max(FLUSH_MIN_MS, ids.length * MS_PER_UPLOAD_ATTEMPT + 60_000);
  const deadline = Date.now() + maxMs;

  while (Date.now() < deadline) {
    await flush();
    const stored = await loadAllReceipts();
    const pending = sessionStillPendingUpload(stored, ids);
    if (pending.length === 0) return;

    await new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, 150);
    });
  }
}
