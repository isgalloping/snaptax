import type { SnaptaxReceipt } from "@prisma/client";
import { formatLocalDate } from "@/lib/format";
import {
  irsScheduleLabel,
  irsScheduleLineShort,
} from "@/lib/tax/irsScheduleLabel";
import { resolveDeductionRatio } from "@/lib/tax/usCategories";
import type { TaxRegion } from "@/lib/tax/types";
import { receiptTaxYear } from "@/lib/tax/taxYearStats";

export type ExportExpenseRow = {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  irsSchedule: string;
  irsLine: string;
  deductibleAmount: number;
  deductible: boolean;
  taxSaved: number;
  notes: string;
  imagePathname: string | null;
};

export function extractAiDeductionRatio(
  aiRaw: SnaptaxReceipt["aiRaw"],
): number {
  if (!aiRaw || typeof aiRaw !== "object" || Array.isArray(aiRaw)) return 1;
  const ratio = (aiRaw as Record<string, unknown>).deduction_ratio;
  return typeof ratio === "number" ? ratio : 1;
}

export function buildExportExpenseRow(
  receipt: SnaptaxReceipt,
  timeZone: string,
  region: TaxRegion,
): ExportExpenseRow {
  const category = (receipt.category ?? "OTHER").toUpperCase().trim() || "OTHER";
  const amount = Number(receipt.amount ?? 0);
  const aiRatio = extractAiDeductionRatio(receipt.aiRaw);
  const ratio = receipt.deductible
    ? resolveDeductionRatio(category, aiRatio)
    : 0;
  const deductibleAmount = round2(amount * ratio);
  const taxSaved = Number(receipt.taxAmount ?? 0);
  const unclassified = !receipt.category?.trim();

  return {
    id: receipt.id,
    date: formatLocalDate(
      receipt.snapAt ?? receipt.capturedAt,
      timeZone,
      region,
    ),
    merchant: receipt.merchantName ?? "",
    amount,
    category,
    irsSchedule: irsScheduleLabel(category),
    irsLine: irsScheduleLineShort(category),
    deductibleAmount,
    deductible: receipt.deductible && ratio > 0,
    taxSaved,
    notes: unclassified ? "Unclassified — review with CPA" : "",
    imagePathname: receipt.imageUrl?.trim() || null,
  };
}

export function filterReceiptsByTaxYear(
  receipts: SnaptaxReceipt[],
  taxYear: number,
  timeZone: string,
): SnaptaxReceipt[] {
  return receipts.filter((r) => {
    const instant = r.snapAt ?? r.capturedAt;
    return receiptTaxYear(instant, timeZone) === taxYear;
  });
}

export function summarizeByIrsLine(
  rows: ExportExpenseRow[],
): { line: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (!row.deductible) continue;
    totals.set(row.irsLine, (totals.get(row.irsLine) ?? 0) + row.deductibleAmount);
  }
  return [...totals.entries()]
    .map(([line, total]) => ({ line, total: round2(total) }))
    .sort((a, b) => a.line.localeCompare(b.line));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
