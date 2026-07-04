import type { ExportExpenseRow } from "@/lib/tax/exportRows";

export function auditEligibleRows(rows: ExportExpenseRow[]): ExportExpenseRow[] {
  return rows.filter((r) => r.deductible && r.exportAmount > 0);
}

/** Schedule C PDF / audit ZIP need at least one deductible expense or 1099 income row. */
export function hasAuditExportContent(
  auditRows: readonly ExportExpenseRow[],
  incomeRows: readonly unknown[],
): boolean {
  return auditRows.length > 0 || incomeRows.length > 0;
}
