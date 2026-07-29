import type { Actor } from "@/lib/auth/getActor";
import { formatCurrency } from "@/lib/format";
import { founderPriceUsdToCents } from "@/lib/founder/pricing";
import type { SeasonOffer } from "@/lib/server/seasonOffer";
import { getSpecialLevelUserPriceId } from "@/lib/server/env";

export type InternalTestSeasonOffer = SeasonOffer & {
  priceDisplay: "internal_test";
  priceLabel: string;
};

export function normalizeWhitelistEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseSpecialUsers(raw: string): ReadonlySet<string> {
  const set = new Set<string>();
  for (const part of raw.split(",")) {
    const email = normalizeWhitelistEmail(part);
    if (email) set.add(email);
  }
  return set;
}

export function isSpecialUser(email: string, specialUsers: string): boolean {
  if (!specialUsers.trim()) return false;
  return parseSpecialUsers(specialUsers).has(normalizeWhitelistEmail(email));
}

export function resolveSpecialCheckoutEligible(
  actor: Actor,
  specialUsers: string,
  specialPriceUsd: number,
): boolean {
  if (!getSpecialLevelUserPriceId()) return false;
  if (!specialUsers.trim() || specialPriceUsd <= 0) return false;
  if (actor.kind !== "user" || !actor.email) return false;
  return isSpecialUser(actor.email, specialUsers);
}

export function buildSpecialSeasonOffer(
  taxSeason: string,
  specialPriceUsd: number,
): InternalTestSeasonOffer {
  return {
    skuTier: "SPECIAL",
    priceUsd: specialPriceUsd,
    priceCents: founderPriceUsdToCents(specialPriceUsd),
    taxSeason,
    priceDisplay: "internal_test",
    priceLabel: formatCurrency(specialPriceUsd),
  };
}
