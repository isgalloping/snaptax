import type { Actor } from "@/lib/auth/getActor";
import type { SeasonOffer } from "@/lib/server/seasonOffer";
import { getPaddlePriceIdSpecial } from "@/lib/server/env";

export const SPECIAL_PRICE_LABEL = "Test price" as const;

export type InternalTestSeasonOffer = SeasonOffer & {
  priceDisplay: "internal_test";
  priceLabel: typeof SPECIAL_PRICE_LABEL;
};

export function normalizeWhitelistEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function resolveSpecialCheckoutEligible(
  actor: Actor,
  verfyUser: string,
): boolean {
  const priceId = getPaddlePriceIdSpecial();
  if (!priceId) return false;
  if (!verfyUser.trim()) return false;
  if (actor.kind !== "user" || !actor.email) return false;
  return (
    normalizeWhitelistEmail(actor.email) === normalizeWhitelistEmail(verfyUser)
  );
}

export function buildSpecialSeasonOffer(taxSeason: string): InternalTestSeasonOffer {
  return {
    skuTier: "SPECIAL",
    priceUsd: 0,
    priceCents: 0,
    taxSeason,
    priceDisplay: "internal_test",
    priceLabel: SPECIAL_PRICE_LABEL,
  };
}
