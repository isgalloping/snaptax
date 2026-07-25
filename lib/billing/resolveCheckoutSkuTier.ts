import type { Actor } from "@/lib/auth/getActor";
import type { FounderTier } from "@/lib/founder/types";
import { resolveSpecialCheckoutEligible } from "@/lib/billing/specialCheckout";
import {
  resolveFounderCheckoutSkuTier,
  type FounderCheckoutUser,
} from "@/lib/server/founderProgram";
import { resolveSeasonOfferFromState } from "@/lib/server/seasonOffer";
import type { FounderTierConfig } from "@/lib/server/founderConfig";

export type ResolveCheckoutSkuTierInput = {
  actor: Actor;
  verfyUser: string;
  body: { founderPurchase?: boolean; skuTier?: FounderTier; taxSeason: string };
  founderUser: FounderCheckoutUser | null;
  claimedCount: number;
  programOpen: boolean;
  enabled: boolean;
  tiers: Record<Exclude<FounderTier, "SPECIAL">, FounderTierConfig>;
};

export type ResolveCheckoutSkuTierResult =
  | { skuTier: "SPECIAL"; isSpecial: true }
  | { skuTier: FounderTier; isSpecial: false };

export function resolveCheckoutSkuTier(
  input: ResolveCheckoutSkuTierInput,
): ResolveCheckoutSkuTierResult {
  if (resolveSpecialCheckoutEligible(input.actor, input.verfyUser)) {
    return { skuTier: "SPECIAL", isSpecial: true };
  }

  if (input.body.founderPurchase) {
    const resolution = resolveFounderCheckoutSkuTier({
      user: input.founderUser,
      claimedCount: input.claimedCount,
      programOpen: input.programOpen,
    });
    if (!resolution.ok) throw new Error(resolution.error);
    return { skuTier: resolution.skuTier, isSpecial: false };
  }

  if (input.body.skuTier != null && input.body.skuTier !== "SPECIAL") {
    return { skuTier: input.body.skuTier, isSpecial: false };
  }

  const offer = resolveSeasonOfferFromState({
    enabled: input.enabled,
    tiers: input.tiers,
    user: input.founderUser,
    claimedCount: input.claimedCount,
    programOpen: input.programOpen,
    taxSeason: input.body.taxSeason,
  });
  return { skuTier: offer.skuTier, isSpecial: false };
}
