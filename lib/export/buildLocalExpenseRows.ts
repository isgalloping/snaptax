import { isIncomeFormType } from "@/lib/export/incomeDocuments";
import { finalizeExportRows } from "@/lib/export/mapping/finalizeExportRows";
import { receiptToSnaptaxStub } from "@/lib/receipts/snaptaxReceiptStub";
import {
  buildExportExpenseRow,
  filterReceiptsByTaxYear,
} from "@/lib/tax/exportRows";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import type { Receipt } from "@/lib/types";

/** Done expense receipts in tax year, finalized for local export builders. */
export function buildLocalExpenseExportRows(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
): ExportExpenseRow[] {
  const snaptaxReceipts = receipts
    .filter((r) => r.status === "done" && !isIncomeFormType(r.category))
    .map(receiptToSnaptaxStub);
  const filtered = filterReceiptsByTaxYear(snaptaxReceipts, taxYear, timeZone);
  const rows = filtered.map((r) => buildExportExpenseRow(r, timeZone, "us"));
  return finalizeExportRows(rows);
}

export function localExpenseReceiptIds(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
): string[] {
  return buildLocalExpenseExportRows(receipts, taxYear, timeZone).map(
    (row) => row.id,
  );
}
