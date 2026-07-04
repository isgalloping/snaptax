import type { ExportExpenseRow } from "@/lib/tax/exportRows";

export function auditEligibleRows(rows: ExportExpenseRow[]): ExportExpenseRow[] {
  return rows.filter((r) => r.deductible && r.exportAmount > 0);
}
