import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { irsCategoryExportLabel } from "@/lib/tax/irsScheduleLabel";

const TURBOTAX_HEADERS = [
  "Date",
  "Vendor",
  "Amount",
  "IRS_Category",
  "Deductible_Amount",
  "Receipt_Image_URL",
] as const;

const FULL_CSV_HEADERS = [
  "Date",
  "Merchant",
  "Amount",
  "Category",
  "IRS Schedule Line",
  "IRS Schedule",
  "Deductible Amount",
  "Deductible (Y/N)",
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

/** TurboTax / tax-software import matrix (RFC 4180, UTF-8 BOM). */
export function buildTurboTaxCsv(rows: ExportExpenseRow[]): string {
  const lines = [TURBOTAX_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      csvLine([
        row.dateIso,
        row.merchant,
        row.amount.toFixed(2),
        irsCategoryExportLabel(row.category),
        row.deductibleAmount.toFixed(2),
        row.receiptImageUrl,
      ]),
    );
  }
  return `\uFEFF${lines.join("\r\n")}`;
}

/** Full CPA detail CSV with all audit columns. */
export function buildExpensesCsv(rows: ExportExpenseRow[]): string {
  const lines = [FULL_CSV_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      csvLine([
        row.dateIso,
        row.merchant,
        row.amount.toFixed(2),
        row.category,
        row.irsLine,
        row.irsSchedule,
        row.deductibleAmount.toFixed(2),
        row.deductible ? "Yes" : "No",
        row.taxSaved.toFixed(2),
        row.notes,
        row.id,
        row.receiptImageUrl,
      ]),
    );
  }
  return `\uFEFF${lines.join("\r\n")}`;
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
    `Snap1099 Tax Year ${taxYear} — Schedule C Summary`,
    "For estimation only — not tax advice.",
    "",
    ...summaryLines.map((s) => `${s.line}: $${s.total.toFixed(2)}`),
    "",
    `Total Deductible: $${totalDeductible.toFixed(2)}`,
    `Receipt Count: ${rows.length}`,
  ];
  return lines.join("\n");
}
