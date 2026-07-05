import type { Receipt } from "@/lib/types";
import { availableTaxYears } from "@/lib/tax/taxYearStats";
import {
  defaultExportTaxYear,
  filingTaxYearForSeason,
} from "@/lib/tax/season";
import { clientTimeZone } from "@/lib/time/timeZone";

/** True when at least one done receipt exists in any calendar tax year. */
export function hasExportableReceipts(
  receipts: Receipt[],
  timeZone: string = clientTimeZone(),
): boolean {
  return availableTaxYears(receipts, timeZone).length > 0;
}

/** Prefer filing year for paid season when it has receipts; else newest with receipts. */
export function pickDefaultExportTaxYear(
  receipts: Receipt[],
  timeZone: string = clientTimeZone(),
  currentSeason?: string,
): number {
  const found = availableTaxYears(receipts, timeZone);
  if (currentSeason) {
    const filingYear = filingTaxYearForSeason(currentSeason);
    if (found.includes(filingYear)) return filingYear;
  }
  if (found.length > 0) return found[0]!;
  if (currentSeason) return filingTaxYearForSeason(currentSeason);
  return Number(defaultExportTaxYear());
}

/** Tax years shown in export Step 1 — filing year for season first, then receipt years. */
export function exportPickerTaxYears(
  receipts: Receipt[],
  timeZone: string = clientTimeZone(),
  currentSeason?: string,
): number[] {
  const found = availableTaxYears(receipts, timeZone);
  const years = new Set<number>();
  if (currentSeason) {
    years.add(filingTaxYearForSeason(currentSeason));
  }
  for (const year of found) years.add(year);
  if (years.size === 0) {
    years.add(Number(defaultExportTaxYear()));
  }
  return [...years].sort((a, b) => b - a);
}
