import type { SnaptaxReceipt } from "@prisma/client";
import { filterReceiptsByTaxYear } from "@/lib/tax/exportRows";

/** Receipt ids that belong to the export tax year (same rules as tax-pack). */
export function receiptIdsInExportTaxYear(
  receipts: SnaptaxReceipt[],
  taxYear: number,
  timeZone: string,
): Set<string> {
  return new Set(
    filterReceiptsByTaxYear(receipts, taxYear, timeZone).map((r) => r.id),
  );
}

/** Ensures every requested id is a done owned receipt in the given calendar tax year. */
export function assertReceiptsMatchExportTaxYear(params: {
  receipts: SnaptaxReceipt[];
  receiptIds: string[];
  taxYear: number;
  timeZone: string;
}): void {
  const inYear = receiptIdsInExportTaxYear(
    params.receipts,
    params.taxYear,
    params.timeZone,
  );
  if (params.receiptIds.some((id) => !inYear.has(id))) {
    throw new Error("INVALID_EXPORT_TAX_YEAR");
  }
}
