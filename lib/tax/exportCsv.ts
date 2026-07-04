import type { ExportExpenseRow } from "@/lib/tax/exportRows";

const TURBOTAX_HEADERS = [
  "Date",
  "Merchant",
  "Category",
  "Amount",
  "Schedule C Line",
  "Tax Deductible",
  "Business %",
  "Receipt_Image_URL",
] as const;

const FULL_CSV_HEADERS = [
  "Date",
  "Merchant",
  "Amount",
  "Category",
  "Schedule C Line",
  "Tax Deductible",
  "Business %",
  "Deductible Amount",
  "Tax Saved (Est.)",
  "Notes",
  "Receipt ID",
  "Receipt Image URL",
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

export type CsvImageUrlStyle = "alias" | "archive";

function receiptImageUrlForRow(
  row: ExportExpenseRow,
  style: CsvImageUrlStyle,
): string {
  if (style === "archive") {
    return row.receiptArchivePath || row.receiptAlias;
  }
  return row.receiptAlias;
}

/** TurboTax import matrix (RFC 4180, UTF-8 without BOM). */
export function buildTurboTaxCsv(rows: ExportExpenseRow[]): string {
  const lines = [TURBOTAX_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      csvLine([
        row.dateIso,
        row.merchant,
        row.categoryDisplay,
        row.exportAmount.toFixed(2),
        row.scheduleCLine,
        row.taxDeductible,
        row.businessPercent,
        receiptImageUrlForRow(row, "alias"),
      ]),
    );
  }
  return lines.join("\r\n");
}

/** @deprecated Use buildAuditDetailCsv for audit ZIP; legacy CPA detail layout. */
export function buildExpensesCsv(
  rows: ExportExpenseRow[],
  imageUrlStyle: CsvImageUrlStyle = "archive",
): string {
  const lines = [FULL_CSV_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      csvLine([
        row.dateIso,
        row.merchant,
        row.amount.toFixed(2),
        row.categoryDisplay || row.category,
        row.scheduleCLine,
        row.taxDeductible,
        row.businessPercent,
        row.deductibleAmount.toFixed(2),
        row.taxSaved.toFixed(2),
        row.notes,
        row.id,
        receiptImageUrlForRow(row, imageUrlStyle),
      ]),
    );
  }
  return lines.join("\r\n");
}

export function buildSummaryText(
  taxYear: string,
  rows: ExportExpenseRow[],
  summaryLines: { line: string; total: number }[],
): string {
  const totalDeductible = rows.reduce(
    (sum, r) => sum + (r.deductible ? r.deductibleAmount : 0),
    0,
  );
  const lines = [
    `Snap1099 Tax Year ${taxYear} — Schedule C Summary (Expenses only)`,
    "Income not tracked in Snap1099 — snap 1099 forms for your CPA.",
    "For estimation only — not tax advice.",
    "",
    ...summaryLines.map((s) => `${s.line}: $${s.total.toFixed(2)}`),
    "",
    `Total Deductible: $${totalDeductible.toFixed(2)}`,
    `Receipt Count: ${rows.length}`,
  ];
  return lines.join("\n");
}
