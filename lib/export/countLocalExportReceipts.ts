import { receiptToSnaptaxStub } from "@/lib/receipts/snaptaxReceiptStub";
import { filterReceiptsByTaxYear } from "@/lib/tax/exportRows";
import type { Receipt } from "@/lib/types";

/** Count done receipts in tax year using the same filter as local export builders. */
export function countLocalExportReceiptsInTaxYear(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
): number {
  const stubs = receipts
    .filter((r) => r.status === "done")
    .map(receiptToSnaptaxStub);
  return filterReceiptsByTaxYear(stubs, taxYear, timeZone).length;
}
