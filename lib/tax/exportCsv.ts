import type { ExportExpenseRow } from "@/lib/tax/exportRows";

const CSV_HEADERS = [
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
] as const;

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildExpensesCsv(rows: ExportExpenseRow[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.date,
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
      ]
        .map(escapeCsvField)
        .join(","),
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
