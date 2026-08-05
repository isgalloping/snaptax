import { filterReceiptsByTaxYear } from "@/lib/tax/exportRows";

type ReceiptRow = { id: string };

export type ResolveFiledReceiptIdsResult =
  | { ok: true; receiptIds: string[] }
  | { ok: false; reason: "NO_RECEIPTS" | "INVALID_RECEIPT_IDS" };

/** Select receipt ids to mark filed for a tax-year export. */
export function resolveFiledReceiptIds(
  allDone: ReceiptRow[],
  taxYearNum: number,
  timeZone: string,
  requestedIds?: string[],
): ResolveFiledReceiptIdsResult {
  const yearReceipts = filterReceiptsByTaxYear(allDone, taxYearNum, timeZone);
  if (yearReceipts.length === 0) {
    return { ok: false, reason: "NO_RECEIPTS" };
  }

  if (!requestedIds || requestedIds.length === 0) {
    return { ok: true, receiptIds: yearReceipts.map((r) => r.id) };
  }

  const allowed = new Set(yearReceipts.map((r) => r.id));
  const uniqueRequested = [...new Set(requestedIds)];
  if (uniqueRequested.some((id) => !allowed.has(id))) {
    return { ok: false, reason: "INVALID_RECEIPT_IDS" };
  }

  return { ok: true, receiptIds: uniqueRequested };
}
