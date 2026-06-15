import type { Receipt } from "@/lib/types";
import { availableTaxYears } from "@/lib/tax/taxYearStats";
import { defaultExportTaxYear } from "@/lib/tax/season";
import { clientTimeZone } from "@/lib/time/timeZone";

/** True when at least one done receipt exists in any calendar tax year. */
export function hasExportableReceipts(
  receipts: Receipt[],
  timeZone: string = clientTimeZone(),
): boolean {
  return availableTaxYears(receipts, timeZone).length > 0;
}

/** Prefer the newest tax year that has done receipts; else calendar default. */
export function pickDefaultExportTaxYear(
  receipts: Receipt[],
  timeZone: string = clientTimeZone(),
): number {
  const found = availableTaxYears(receipts, timeZone);
  if (found.length > 0) return found[0]!;
  return Number(defaultExportTaxYear());
}
