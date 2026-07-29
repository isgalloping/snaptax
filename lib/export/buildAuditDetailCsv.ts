import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { exportIrsLineKeyForRow } from "@/lib/export/scheduleCLines";

const HEADERS = [
  "Date",
  "IRS_Line",
  "Category",
  "Merchant",
  "Amount",
  "Memo",
  "Audit_Image_Path",
  "Receipt_Image_URL",
] as const;

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvLine(values: (string | number)[]): string {
  return values.map(escapeCsvField).join(",");
}

export function buildAuditDetailCsv(rows: ExportExpenseRow[]): string {
  const lines = [HEADERS.join(",")];
  for (const row of rows) {
    const auditPath = row.auditImagePath ?? "";
    // One image per row: Audit_Image_Path → ZIP file; Receipt_Image_URL → legacy alias only.
    const receiptRef = row.receiptAlias || auditPath;
    lines.push(
      csvLine([
        row.dateIso,
        exportIrsLineKeyForRow(row),
        row.categoryDisplay,
        row.merchant,
        row.exportAmount.toFixed(2),
        row.notes,
        auditPath,
        receiptRef,
      ]),
    );
  }
  return lines.join("\r\n");
}
