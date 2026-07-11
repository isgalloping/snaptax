import type { Receipt } from "@/lib/types";
import { availableTaxYears } from "@/lib/tax/taxYearStats";
import {
  defaultExportTaxYear,
  filingTaxYearForSeason,
} from "@/lib/tax/season";
import { clientTimeZone } from "@/lib/time/timeZone";

export type TaxExportGateAction =
  | { kind: "empty"; receipts: Receipt[] }
  | { kind: "google"; receipts: Receipt[] }
  | { kind: "paywall"; receipts: Receipt[] }
  | { kind: "export"; receipts: Receipt[] };

interface ResolveTaxExportGateActionOptions {
  receipts: Receipt[];
  preparedReceipts?: Receipt[] | void;
  googleUserPresent: boolean;
  seasonPaid: boolean;
  timeZone?: string;
}

export function realExportReceipts(
  receipts: Receipt[],
  preparedReceipts?: Receipt[] | void,
): Receipt[] {
  return (preparedReceipts ?? receipts).filter((r) => !r.isOnboardingDemo);
}

export function resolveTaxExportGateAction({
  receipts,
  preparedReceipts,
  googleUserPresent,
  seasonPaid,
  timeZone,
}: ResolveTaxExportGateActionOptions): TaxExportGateAction {
  const exportReceipts = realExportReceipts(receipts, preparedReceipts);

  if (!hasExportableReceipts(exportReceipts, timeZone)) {
    return { kind: "empty", receipts: exportReceipts };
  }
  if (!googleUserPresent) {
    return { kind: "google", receipts: exportReceipts };
  }
  if (!seasonPaid) {
    return { kind: "paywall", receipts: exportReceipts };
  }
  return { kind: "export", receipts: exportReceipts };
}

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
