export function bypassTransactionId(userId: string, taxSeason: string): string {
  return `verify_bypass_${userId}_${taxSeason}`;
}
