export type DuplicateMatchType = "exact" | "similar";

export function duplicateNoticeCopy(
  copy: { duplicateReceipt: string; duplicateReceiptSimilar: string },
  matchType: DuplicateMatchType,
): string {
  return matchType === "similar"
    ? copy.duplicateReceiptSimilar
    : copy.duplicateReceipt;
}

export function scrollReceiptIntoView(receiptId: string): void {
  const el = document.querySelector(`[data-receipt-id="${receiptId}"]`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export const DUPLICATE_HIGHLIGHT_MS = 2000;
