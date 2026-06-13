import type { Receipt } from "@/lib/types";

/** Receipts that should be reviewed before tax export. */
export function receiptNeedsExportReview(receipt: Receipt): boolean {
  if (receipt.status !== "done") return false;
  const category = receipt.category?.toUpperCase().trim();
  return !category || category === "OTHER";
}

export function receiptsNeedingExportReview(receipts: Receipt[]): Receipt[] {
  return receipts.filter(receiptNeedsExportReview);
}
