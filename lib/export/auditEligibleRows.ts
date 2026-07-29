import type { ExportExpenseRow } from "@/lib/tax/exportRows";

/** Rows included in QIF/QBO/TXF and CPA audit exports (post-finalize). */
export function exportEligibleRows(rows: ExportExpenseRow[]): ExportExpenseRow[] {
  return rows.filter((r) => r.taxDeductible !== "No" && r.exportAmount > 0);
}

export function auditEligibleRows(rows: ExportExpenseRow[]): ExportExpenseRow[] {
  return exportEligibleRows(rows);
}

/** Schedule C PDF / audit ZIP need at least one deductible expense or 1099 income row. */
export function hasAuditExportContent(
  auditRows: readonly ExportExpenseRow[],
  incomeRows: readonly unknown[],
): boolean {
  return auditRows.length > 0 || incomeRows.length > 0;
}
