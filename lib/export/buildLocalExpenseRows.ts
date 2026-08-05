import { isIncomeFormType } from "@/lib/export/incomeDocuments";
import { finalizeExportRows } from "@/lib/export/mapping/finalizeExportRows";
import { receiptToSnaptaxStub } from "@/lib/receipts/snaptaxReceiptStub";
import {
  buildExportExpenseRow,
  filterReceiptsByTaxYear,
} from "@/lib/tax/exportRows";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import type { TaxRegion } from "@/lib/tax/types";
import type { Receipt } from "@/lib/types";

/** Done expense receipts in tax year, finalized for local export builders. */
export function buildLocalExpenseExportRows(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
  dataRegion: TaxRegion = "us",
): ExportExpenseRow[] {
  const snaptaxReceipts = receipts
    .filter((r) => r.status === "done" && !isIncomeFormType(r.category))
    .map(receiptToSnaptaxStub);
  const filtered = filterReceiptsByTaxYear(snaptaxReceipts, taxYear, timeZone);
  const rows = filtered.map((r) => buildExportExpenseRow(r, timeZone, dataRegion));
  return finalizeExportRows(rows);
}

export function localExpenseReceiptIds(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
  dataRegion: TaxRegion = "us",
): string[] {
  return buildLocalExpenseExportRows(receipts, taxYear, timeZone, dataRegion).map(
    (row) => row.id,
  );
}
