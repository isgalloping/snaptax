import { assignAuditTrailMeta } from "@/lib/export/assignAuditTrailMeta";
import { auditEligibleRows } from "@/lib/export/auditEligibleRows";
import {
  buildExportIncomeRow,
  isIncomeDocument,
} from "@/lib/export/incomeDocuments";
import { finalizeExportRows } from "@/lib/export/mapping/finalizeExportRows";
import { receiptToSnaptaxStub } from "@/lib/receipts/snaptaxReceiptStub";
import {
  buildExportExpenseRow,
  filterReceiptsByTaxYear,
} from "@/lib/tax/exportRows";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import type { ExportIncomeRow } from "@/lib/export/incomeDocuments";
import type { TaxRegion } from "@/lib/tax/types";
import type { Receipt } from "@/lib/types";

export type LocalCpaExportContext = {
  yearReceiptCount: number;
  incomeRows: ExportIncomeRow[];
  enrichedExpenseRows: ExportExpenseRow[];
  auditRows: ExportExpenseRow[];
};

function stubCaptureMs(receipt: ReturnType<typeof receiptToSnaptaxStub>): number {
  return (receipt.snapAt ?? receipt.capturedAt).getTime();
}

/** Build CPA/PDF row context from local IDB receipts (same pipeline as server tax-pack). */
export function buildLocalCpaExportContext(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
  dataRegion: TaxRegion = "us",
): LocalCpaExportContext {
  const doneStubs = receipts
    .filter((r) => r.status === "done")
    .map(receiptToSnaptaxStub);
  const yearStubs = filterReceiptsByTaxYear(doneStubs, taxYear, timeZone).sort(
    (a, b) => stubCaptureMs(a) - stubCaptureMs(b),
  );

  const incomeReceipts = yearStubs.filter(isIncomeDocument);
  const expenseReceipts = yearStubs.filter((r) => !isIncomeDocument(r));

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
    yearReceiptCount: yearStubs.length,
    incomeRows,
    enrichedExpenseRows,
    auditRows,
  };
}
