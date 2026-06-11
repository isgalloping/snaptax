export function currentTaxSeason(date = new Date()): string {
  // TODO: 07-paddle-billing.md specifies 5-12月 should return next year's season — needs product decision
  return String(date.getUTCFullYear());
}
