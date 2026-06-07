export function currentTaxSeason(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  if (month <= 4) return String(year);
  return String(year);
}
