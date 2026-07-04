import { isIncomeFormType } from "@/lib/export/incomeDocuments";
import { isReceiptFiled } from "@/lib/receipts/filedStatus";
import type { StoredReceipt } from "@/lib/storage/receiptDb";
import { effectiveReceiptTaxYear } from "@/lib/tax/taxYearStats";
import { resolveDeductionRatio } from "@/lib/tax/usCategories";

export type SummaryDelta = {
  unfiledTaxSaved: number;
  totalReceiptCount: number;
  totalDeductions: number;
  incomeFormCount: number;
  totalIncomeGross: number;
};

function inSeason(
  row: StoredReceipt | null,
  taxYear: number,
  timeZone: string,
): boolean {
  if (!row) return false;
  return effectiveReceiptTaxYear(row, timeZone) === taxYear;
}

function unfiledTaxContribution(row: StoredReceipt): number {
  if (row.status !== "done" || isReceiptFiled(row)) return 0;
  return row.taxAmount ?? 0;
}

function deductionContribution(row: StoredReceipt): number {
  if (row.status !== "done") return 0;
  if (isIncomeFormType(row.category)) return 0;
  if (!row.deductible || row.amount == null) return 0;
  const ratio = resolveDeductionRatio(row.category ?? "OTHER", 1);
  return Math.round(row.amount * ratio * 100) / 100;
}

function incomeFormContribution(row: StoredReceipt): { count: number; gross: number } {
  if (row.status !== "done" || !isIncomeFormType(row.category)) {
    return { count: 0, gross: 0 };
  }
  return { count: 1, gross: row.amount ?? 0 };
}

function contributions(row: StoredReceipt): SummaryDelta {
  const income = incomeFormContribution(row);
  return {
    unfiledTaxSaved: unfiledTaxContribution(row),
    totalReceiptCount: 1,
    totalDeductions: deductionContribution(row),
    incomeFormCount: income.count,
    totalIncomeGross: income.gross,
  };
}

const ZERO: SummaryDelta = {
  unfiledTaxSaved: 0,
  totalReceiptCount: 0,
  totalDeductions: 0,
  incomeFormCount: 0,
  totalIncomeGross: 0,
};

export function computeSummaryDelta(
  prev: StoredReceipt | null,
  next: StoredReceipt | null,
  taxYear: number,
  timeZone: string,
): SummaryDelta {
  const prevIn = inSeason(prev, taxYear, timeZone);
  const nextIn = inSeason(next, taxYear, timeZone);
  const prevC = prevIn && prev ? contributions(prev) : ZERO;
  const nextC = nextIn && next ? contributions(next) : ZERO;
  return {
    unfiledTaxSaved: nextC.unfiledTaxSaved - prevC.unfiledTaxSaved,
    totalReceiptCount: nextC.totalReceiptCount - prevC.totalReceiptCount,
    totalDeductions: nextC.totalDeductions - prevC.totalDeductions,
    incomeFormCount: nextC.incomeFormCount - prevC.incomeFormCount,
    totalIncomeGross: nextC.totalIncomeGross - prevC.totalIncomeGross,
  };
}
