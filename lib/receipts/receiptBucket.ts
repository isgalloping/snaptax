import type { Receipt } from "@/lib/types";
import { receiptNeedsExportReview } from "@/lib/tax/exportReview";

export type ReceiptBucket = "ready" | "review" | "action" | "processing";
export type ReceiptListFilter = "all" | ReceiptBucket;

export type BucketCounts = {
  all: number;
  ready: number;
  review: number;
  action: number;
  processing: number;
};

export function needsUserReview(receipt: Receipt): boolean {
  if (receipt.status !== "done") return false;
  if (receiptNeedsExportReview(receipt)) return true;
  if (receipt.amount == null || receipt.amount <= 0) return true;
  const c = receipt.aiConfidence;
  if (c != null && c >= 0.5 && c < 0.7) return true;
  return false;
}

export function classifyReceiptBucket(
  receipt: Receipt,
  opts?: { syncStuck?: boolean },
): ReceiptBucket {
  if (receipt.status === "processing" || opts?.syncStuck) return "processing";
  if (receipt.status === "blurry" || receipt.photoMissing) return "action";
  if (receipt.status === "done" && needsUserReview(receipt)) return "review";
  return "ready";
}

export function countReceiptBuckets(
  receipts: Receipt[],
  syncStuckIds: Set<string>,
): BucketCounts {
  const counts: BucketCounts = {
    all: receipts.length,
    ready: 0,
    review: 0,
    action: 0,
    processing: 0,
  };
  for (const receipt of receipts) {
    const bucket = classifyReceiptBucket(receipt, {
      syncStuck: syncStuckIds.has(receipt.id),
    });
    counts[bucket] += 1;
  }
  return counts;
}

export function filterReceiptsByBucket(
  receipts: Receipt[],
  filter: ReceiptListFilter,
  syncStuckIds: Set<string>,
): Receipt[] {
  if (filter === "all") return receipts;
  return receipts.filter(
    (receipt) =>
      classifyReceiptBucket(receipt, {
        syncStuck: syncStuckIds.has(receipt.id),
      }) === filter,
  );
}
