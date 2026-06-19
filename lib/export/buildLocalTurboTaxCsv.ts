import { isIncomeFormType } from "@/lib/export/incomeDocuments";
import { finalizeExportRows } from "@/lib/export/mapping/finalizeExportRows";
import { receiptToSnaptaxStub } from "@/lib/receipts/snaptaxReceiptStub";
import { buildTurboTaxCsv } from "@/lib/tax/exportCsv";
import {
  buildExportExpenseRow,
  filterReceiptsByTaxYear,
} from "@/lib/tax/exportRows";
import type { Receipt } from "@/lib/types";

/**
 * Client-side TurboTax CSV preview (no signed image URLs).
 * Uses the same column layout as server export after finalizeExportRows.
 */
export function buildLocalTurboTaxCsv(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
): string {
  const snaptaxReceipts = receipts
    .filter((r) => r.status === "done" && !isIncomeFormType(r.category))
    .map(receiptToSnaptaxStub);
  const filtered = filterReceiptsByTaxYear(
    snaptaxReceipts,
    taxYear,
    timeZone,
  );
  const rows = filtered.map((r) =>
    buildExportExpenseRow(r, timeZone, "us"),
  );
  return buildTurboTaxCsv(finalizeExportRows(rows));
}
