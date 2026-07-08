import { assignAuditTrailMeta } from "@/lib/export/assignAuditTrailMeta";
import { auditEligibleRows } from "@/lib/export/auditEligibleRows";
import {
  buildExportIncomeRow,
  isIncomeDocument,
} from "@/lib/export/incomeDocuments";
import { finalizeExportRows } from "@/lib/export/mapping/finalizeExportRows";
import { receiptToSnaptaxStub } from "@/lib/receipts/snaptaxReceiptStub";
import { buildExportExpenseRow } from "@/lib/tax/exportRows";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import type { ExportIncomeRow } from "@/lib/export/incomeDocuments";
import { receiptsInTaxYear } from "@/lib/tax/taxYearStats";
import type { TaxRegion } from "@/lib/tax/types";
import type { Receipt } from "@/lib/types";

export type LocalCpaExportContext = {
  yearReceiptCount: number;
  incomeRows: ExportIncomeRow[];
  enrichedExpenseRows: ExportExpenseRow[];
  auditRows: ExportExpenseRow[];
};

/** Build CPA/PDF row context from local IDB receipts (same pipeline as server tax-pack). */
export function buildLocalCpaExportContext(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
  dataRegion: TaxRegion = "us",
): LocalCpaExportContext {
  const yearReceipts = receiptsInTaxYear(receipts, taxYear, timeZone).sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );
  const stubs = yearReceipts.map(receiptToSnaptaxStub);
  const incomeReceipts = stubs.filter(isIncomeDocument);
  const expenseReceipts = stubs.filter((r) => !isIncomeDocument(r));

  const incomeRows = incomeReceipts
    .map((r) => buildExportIncomeRow(r, timeZone))
    .filter((row): row is ExportIncomeRow => row != null);

  const expenseRows = expenseReceipts.map((r) =>
    buildExportExpenseRow(r, timeZone, dataRegion),
  );
  const enrichedExpenseRows = finalizeExportRows(expenseRows);
  const auditRows = assignAuditTrailMeta(
    auditEligibleRows(enrichedExpenseRows),
  );

  return {
    yearReceiptCount: yearReceipts.length,
    incomeRows,
    enrichedExpenseRows,
    auditRows,
  };
}
