import type { Receipt } from "@/lib/types";
import { formatIsoDate } from "@/lib/format";
import { irsCategoryExportLabel } from "@/lib/tax/irsScheduleLabel";
import { resolveDeductionRatio } from "@/lib/tax/usCategories";
import { receiptTaxYear } from "@/lib/tax/taxYearStats";

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

/**
 * Client-side TurboTax CSV preview (no signed image URLs).
 * Useful for instant offline preview before server export.
 */
export function buildLocalTurboTaxCsv(
  receipts: Receipt[],
  taxYear: number,
  timeZone: string,
): string {
  const headers = [
    "Date",
    "Vendor",
    "Amount",
    "IRS_Category",
    "Deductible_Amount",
    "Receipt_Image_URL",
  ];
  const lines = [headers.join(",")];

  for (const receipt of receipts) {
    if (receipt.status !== "done") continue;
    if (receiptTaxYear(receipt.timestamp, timeZone) !== taxYear) continue;

    const category = (receipt.category ?? "OTHER").toUpperCase().trim() || "OTHER";
    const amount = Number(receipt.amount ?? 0);
    const ratio =
      receipt.deductible && category !== "PERSONAL"
        ? resolveDeductionRatio(category, 1)
        : 0;
    const deductibleAmount = Math.round(amount * ratio * 100) / 100;

    lines.push(
      csvLine([
        formatIsoDate(receipt.timestamp, timeZone),
        receipt.merchant ?? "",
        amount.toFixed(2),
        irsCategoryExportLabel(category),
        deductibleAmount.toFixed(2),
        "",
      ]),
    );
  }

  return `\uFEFF${lines.join("\r\n")}`;
}
