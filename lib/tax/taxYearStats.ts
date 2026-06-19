import type { Receipt } from "@/lib/types";
import { isIncomeFormType } from "@/lib/export/incomeDocuments";
import { resolveDeductionRatio } from "@/lib/tax/usCategories";
import { clientTimeZone } from "@/lib/time/timeZone";

/** Calendar tax year for a receipt instant in the user's IANA timezone. */
export function receiptTaxYear(
  date: Date,
  timeZone: string = clientTimeZone(),
): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  return Number(parts.find((p) => p.type === "year")?.value ?? "0");
}

function effectiveReceiptTaxYear(
  receipt: Pick<Receipt, "timestamp" | "category" | "incomeTaxYear">,
  timeZone: string,
): number {
  if (isIncomeFormType(receipt.category) && receipt.incomeTaxYear != null) {
    return receipt.incomeTaxYear;
  }
  return receiptTaxYear(receipt.timestamp, timeZone);
}

export function receiptsInTaxYear(
  receipts: Receipt[],
  year: number,
  timeZone: string = clientTimeZone(),
): Receipt[] {
  return receipts.filter(
    (r) =>
      r.status === "done" && effectiveReceiptTaxYear(r, timeZone) === year,
  );
}

/** Sum of deductible bases (amount × ratio), not est. tax saved. */
export function taxYearDeductions(
  receipts: Receipt[],
  year: number,
  timeZone: string = clientTimeZone(),
): number {
  const inYear = receiptsInTaxYear(receipts, year, timeZone);
  return round2(
    inYear.reduce((sum, r) => {
      if (isIncomeFormType(r.category)) return sum;
      if (!r.deductible || r.amount == null) return sum;
      const ratio = resolveDeductionRatio(r.category ?? "OTHER", 1);
      return sum + r.amount * ratio;
    }, 0),
  );
}

export function incomeFormsInTaxYear(
  receipts: Receipt[],
  year: number,
  timeZone: string = clientTimeZone(),
): number {
  return receiptsInTaxYear(receipts, year, timeZone).filter((r) =>
    isIncomeFormType(r.category),
  ).length;
}

export function totalIncomeGrossInTaxYear(
  receipts: Receipt[],
  year: number,
  timeZone: string = clientTimeZone(),
): number {
  return round2(
    receiptsInTaxYear(receipts, year, timeZone).reduce((sum, r) => {
      if (!isIncomeFormType(r.category)) return sum;
      return sum + (r.amount ?? 0);
    }, 0),
  );
}

export function availableTaxYears(
  receipts: Receipt[],
  timeZone: string = clientTimeZone(),
): number[] {
  const years = new Set<number>();
  for (const r of receipts) {
    if (r.status !== "done") continue;
    years.add(effectiveReceiptTaxYear(r, timeZone));
  }
  return [...years].sort((a, b) => b - a);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
