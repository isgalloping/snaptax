/** Founder season prices are configured in whole USD via Vercel Flags. */

export function founderPriceUsdToCents(usd: number): number {
  return Math.round(usd * 100);
}

export function founderPriceCentsToUsd(cents: number): number {
  return cents / 100;
}
