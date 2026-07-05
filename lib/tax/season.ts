/**
 * Paddle entitlement season label.
 * Jan–Apr: active filing season for the current UTC year.
 * May–Dec: sell/export pack for the upcoming filing season (next year).
 */
export function currentTaxSeason(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  if (month <= 4) return String(year);
  return String(year + 1);
}

/** Default tax year in export picker (calendar year of receipts). */
export function defaultExportTaxYear(date = new Date()): string {
  return String(date.getUTCFullYear());
}

/**
 * Calendar tax year covered by a Paddle/filing season label.
 * Season 2027 = file in early 2027 for income earned in calendar 2026.
 */
export function filingTaxYearForSeason(season: string): number {
  return Number(season) - 1;
}
