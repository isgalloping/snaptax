import type { Receipt } from "@/lib/types";
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

export function receiptsInTaxYear(
  receipts: Receipt[],
  year: number,
  timeZone: string = clientTimeZone(),
): Receipt[] {
  return receipts.filter(
    (r) =>
      r.status === "done" && receiptTaxYear(r.timestamp, timeZone) === year,
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
      if (!r.deductible || r.amount == null) return sum;
      const ratio = resolveDeductionRatio(r.category ?? "OTHER", 1);
      return sum + r.amount * ratio;
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
    years.add(receiptTaxYear(r.timestamp, timeZone));
  }
  return [...years].sort((a, b) => b - a);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
