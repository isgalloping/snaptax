import {
  filterReceiptsByTaxYear,
  type TaxYearFilterableReceipt,
} from "@/lib/tax/exportRows";

type ReceiptRow = TaxYearFilterableReceipt;

export type ResolveFiledReceiptIdsResult =
  | { ok: true; receiptIds: string[] }
  | { ok: false; reason: "NO_RECEIPTS" };

/** Select receipt ids to mark filed for a tax-year export. */
export function resolveFiledReceiptIds(
  allDone: ReceiptRow[],
  taxYearNum: number,
  timeZone: string,
  requestedIds?: string[],
): ResolveFiledReceiptIdsResult {
  const yearReceipts = filterReceiptsByTaxYear(allDone, taxYearNum, timeZone);
  const allowed = new Set(yearReceipts.map((r) => r.id));

  let receiptIds: string[];
  if (!requestedIds || requestedIds.length === 0) {
    receiptIds = yearReceipts.map((r) => r.id);
  } else {
    const seen = new Set<string>();
    receiptIds = [];
    for (const id of requestedIds) {
      if (!allowed.has(id) || seen.has(id)) continue;
      seen.add(id);
      receiptIds.push(id);
    }
  }

  if (receiptIds.length === 0) {
    return { ok: false, reason: "NO_RECEIPTS" };
  }

  return { ok: true, receiptIds };
}
