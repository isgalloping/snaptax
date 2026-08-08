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

export type RestoreProgress = { done: number; total: number | null };

const IMAGE_DOWNLOAD_CONCURRENCY = 3;

type RestoreReceiptsFromCloudDeps = {
  fetchReceiptSyncPage: typeof fetchReceiptSyncPage;
  readDeletedReceiptIds: typeof readDeletedReceiptIds;
  loadAllReceipts: typeof loadAllReceipts;
  persistMergedReceipts: typeof persistMergedReceipts;
  hasLocalPhoto: typeof hasLocalPhoto;
  downloadReceiptImage: typeof downloadReceiptImage;
  warmReceiptDb: typeof warmReceiptDb;
  rebuildCurrentSeasonSummary: typeof rebuildCurrentSeasonSummary;
};

export function filterTombstonedReceipts<T extends { id: string }>(
  receipts: T[],
  tombstones: ReadonlySet<string>,
  opts?: { includeIds?: ReadonlySet<string> },
): T[] {
  return receipts.filter(
    (r) => !tombstones.has(r.id) && (opts?.includeIds?.has(r.id) ?? true),
  );
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

export async function hasLocalPhoto(id: string): Promise<boolean> {
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
}, deps: RestoreReceiptsFromCloudDeps = {
  fetchReceiptSyncPage,
  readDeletedReceiptIds,
  loadAllReceipts,
  persistMergedReceipts,
  hasLocalPhoto,
  downloadReceiptImage,
  warmReceiptDb,
  rebuildCurrentSeasonSummary,
}): Promise<{ restoredCount: number }> {
  const onProgress = opts?.onProgress;
  const downloadImages = opts?.downloadImages !== false;

  onProgress?.({ done: 0, total: null });

  const tombstones = await deps.readDeletedReceiptIds();
  let local = await deps.loadAllReceipts();

  let cursor: string | undefined;
  let hasMore = true;
  let restoredCount = 0;
  const restoredRemoteIds = new Set<string>();

  while (hasMore) {
    const page = await deps.fetchReceiptSyncPage(cursor);
    const filtered = filterTombstonedReceipts(page.receipts, tombstones);
    restoredCount += filtered.length;
    for (const receipt of filtered) {
      restoredRemoteIds.add(receipt.id);
    }

    const merged = unionMergeLWW(local, remoteReceiptsToLocal(filtered));
    await deps.persistMergedReceipts(merged, local);
    local = merged;

    onProgress?.({ done: restoredCount, total: null });

    cursor = page.nextCursor ?? undefined;
    hasMore = page.hasMore;
  }

  if (downloadImages) {
    const imageCandidates = filterTombstonedReceipts(
      local.filter((r) => r.hasRemoteImage),
      tombstones,
      { includeIds: restoredRemoteIds },
    );
    let imagesDone = 0;

    await mapWithConcurrency(
      imageCandidates,
      IMAGE_DOWNLOAD_CONCURRENCY,
      async (receipt) => {
        if (!(await deps.hasLocalPhoto(receipt.id))) {
          await deps.downloadReceiptImage(receipt.id);
        }
        imagesDone += 1;
        onProgress?.({ done: imagesDone, total: imageCandidates.length });
      },
    );
  }

  const db = await deps.warmReceiptDb();
  await deps.rebuildCurrentSeasonSummary(db);

  return { restoredCount };
}
