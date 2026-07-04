import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { buildAuditImagePath } from "@/lib/export/mapping/auditImageNaming";

export function assignAuditTrailMeta(
  rows: ExportExpenseRow[],
): ExportExpenseRow[] {
  return rows.map((row, index) => {
    const auditIndex = String(index + 1).padStart(3, "0");
    const auditImagePath = buildAuditImagePath({
      scheduleCLine: row.scheduleCLine || "Line 27a",
      dateIso: row.dateIso,
      merchant: row.merchant,
      exportAmount: row.exportAmount,
      auditIndex,
    });
    return {
      ...row,
      auditIndex,
      auditImagePath,
      receiptArchivePath: auditImagePath,
    };
  });
}
