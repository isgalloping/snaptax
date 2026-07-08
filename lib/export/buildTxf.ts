import { LEGAL_BRAND_NAME } from "@/lib/legal/operator";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import { txfTdForMerchant } from "@/lib/export/mapping/txfCategoryMapping";

function formatTxfDate(dateIso: string): string {
  const [y, m, d] = dateIso.split("-");
  return `${m}/${d}/${y}`;
}

function formatTxfAmount(amount: number): string {
  return amount.toFixed(2);
}

/** TXF V042 export — expense blocks only (no mileage TD 2214 aggregate). */
export function buildTxfExport(
  rows: ExportExpenseRow[],
  exportDate: Date = new Date(),
): string {
  const headerDate = formatTxfDate(exportDate.toISOString().slice(0, 10));
  const lines = ["V042", `${LEGAL_BRAND_NAME} Export`, `D ${headerDate}`];

  for (const row of rows) {
    if (row.taxDeductible === "No" || row.exportAmount <= 0) continue;

    const td = txfTdForMerchant(row.merchant, row.category);
    lines.push(
      "^",
      `TD ${td}`,
      "G 1",
      `P ${row.merchant}`,
      `D ${formatTxfDate(row.dateIso)}`,
      "M 1099 Business Expense",
      `$ ${formatTxfAmount(row.exportAmount)}`,
    );
  }

  return `${lines.join("\n")}\n`;
}
