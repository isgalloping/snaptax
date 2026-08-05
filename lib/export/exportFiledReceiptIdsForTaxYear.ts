import { receiptToSnaptaxStub } from "@/lib/receipts/snaptaxReceiptStub";
import { filterReceiptsByTaxYear } from "@/lib/tax/exportRows";
import type { Receipt } from "@/lib/types";

/** All done receipt ids in a tax year — used for filed sync regardless of export format. */
export function exportFiledReceiptIdsForTaxYear(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
): string[] {
  const doneStubs = receipts
    .filter((r) => r.status === "done")
    .map(receiptToSnaptaxStub);
  return filterReceiptsByTaxYear(doneStubs, taxYear, timeZone).map((r) => r.id);
}
