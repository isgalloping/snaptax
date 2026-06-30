import { compressReceiptImage } from "@/lib/camera/compressReceiptImage";
import {
  fetchReceiptImageUrl,
  fetchReceiptSyncPage,
} from "@/lib/client/receiptApi";
import { readDeletedReceiptIds } from "@/lib/client/receiptDeleteTombstones";
import {
  persistMergedReceipts,
  remoteReceiptsToLocal,
  unionMergeLWW,
} from "@/lib/client/receiptSync";
import { rebuildCurrentSeasonSummary } from "@/lib/storage/receiptSummary";
import {
  loadAllReceipts,
  loadPhoto,
  markRemoteSyncedPhotos,
  savePhotoCompressed,
  warmReceiptDb,
} from "@/lib/storage/receiptDb";
import { getPhotoMeta } from "@/lib/storage/photoMetadata";

export type RestoreProgress = { done: number; total: number | null };

const IMAGE_DOWNLOAD_CONCURRENCY = 3;

export function filterTombstonedReceipts<T extends { id: string }>(
  receipts: T[],
  tombstones: ReadonlySet<string>,
): T[] {
  return receipts.filter((r) => !tombstones.has(r.id));
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<void>,
): Promise<void> {
  if (items.length === 0) return;
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      await mapper(items[index]!);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, items.length) },
      () => worker(),
    ),
  );
}

async function hasLocalPhoto(id: string): Promise<boolean> {
  const db = await warmReceiptDb();
  if (await getPhotoMeta(db, id)) return true;
  const blob = await loadPhoto(id);
  return blob != null;
}

async function downloadReceiptImage(id: string): Promise<void> {
  const { url } = await fetchReceiptImageUrl(id);
  const res = await fetch(url);
  if (!res.ok) throw new Error("DOWNLOAD_RECEIPT_IMAGE_FAILED");
  const blob = await res.blob();
  const compressed = await compressReceiptImage(blob);
  await savePhotoCompressed(id, compressed);
  await markRemoteSyncedPhotos([id]);
}

export async function restoreReceiptsFromCloud(opts?: {
  onProgress?: (p: RestoreProgress) => void;
  downloadImages?: boolean;
}): Promise<{ restoredCount: number }> {
  const onProgress = opts?.onProgress;
  const downloadImages = opts?.downloadImages !== false;

  onProgress?.({ done: 0, total: null });

  const tombstones = await readDeletedReceiptIds();
  let local = await loadAllReceipts();

  let cursor: string | undefined;
  let hasMore = true;
  let restoredCount = 0;

  while (hasMore) {
    const page = await fetchReceiptSyncPage(cursor);
    const filtered = filterTombstonedReceipts(page.receipts, tombstones);
    restoredCount += filtered.length;

    const merged = unionMergeLWW(local, remoteReceiptsToLocal(filtered));
    await persistMergedReceipts(merged, local);
    local = merged;

    onProgress?.({ done: restoredCount, total: null });

    cursor = page.nextCursor ?? undefined;
    hasMore = page.hasMore;
  }

  if (downloadImages) {
    const imageCandidates = local.filter(
      (r) => r.hasRemoteImage && !tombstones.has(r.id),
    );
    let imagesDone = 0;

    await mapWithConcurrency(
      imageCandidates,
      IMAGE_DOWNLOAD_CONCURRENCY,
      async (receipt) => {
        if (!(await hasLocalPhoto(receipt.id))) {
          await downloadReceiptImage(receipt.id);
        }
        imagesDone += 1;
        onProgress?.({ done: imagesDone, total: imageCandidates.length });
      },
    );
  }

  const db = await warmReceiptDb();
  await rebuildCurrentSeasonSummary(db);

  return { restoredCount };
}
