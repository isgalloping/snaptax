import type { ExportExpenseRow } from "@/lib/tax/exportRows";

function formatQifDate(dateIso: string): string {
  const [y, m, d] = dateIso.split("-");
  return `${m}/${d}/${y}`;
}

function formatQifAmount(amount: number): string {
  return (-amount).toFixed(2);
}

function qifCategoryLine(row: ExportExpenseRow): string {
  const label = row.categoryDisplay.trim() || "Other expenses";
  if (row.scheduleCLine) {
    return `Job Expenses:${label} (${row.scheduleCLine})`;
  }
  return `Job Expenses:${label}`;
}

function qifMemo(row: ExportExpenseRow): string {
  const fitId = `SNPTX${row.id.replace(/-/g, "")}`;
  const notes = row.notes.trim();
  return notes ? `${fitId} · ${notes}` : fitId;
}

/** QuickBooks QIF export — deductible expense rows only. */
export function buildQifExport(rows: ExportExpenseRow[]): string {
  const lines: string[] = ["!Type:Cash", "!Account:SnapTax Expenses"];

  for (const row of rows) {
    if (row.taxDeductible === "No" || row.exportAmount <= 0) continue;

    lines.push(
      `D${formatQifDate(row.dateIso)}`,
      `T${formatQifAmount(row.exportAmount)}`,
      `P${row.merchant}`,
      `L${qifCategoryLine(row)}`,
      `M${qifMemo(row)}`,
      "^",
    );
  }

  return `${lines.join("\n")}\n`;
}
