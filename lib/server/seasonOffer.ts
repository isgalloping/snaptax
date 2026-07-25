import type { FounderTier, PublicFounderTier } from "@/lib/founder/types";
import type { Actor } from "@/lib/auth/getActor";
import {
  buildSpecialSeasonOffer,
  resolveSpecialCheckoutEligible,
} from "@/lib/billing/specialCheckout";
import {
  getFounderProgramState,
  resolveFounderCheckoutSkuTier,
  type FounderCheckoutUser,
} from "@/lib/server/founderProgram";
import {
  resolveFounderProgramConfig,
  type FounderTierConfig,
} from "@/lib/server/founderConfig";
import { currentTaxSeason } from "@/lib/tax/season";

export type SeasonOffer = {
  priceUsd: number;
  priceCents: number;
  skuTier: FounderTier;
  taxSeason: string;
  priceDisplay?: "internal_test";
  priceLabel?: string;
};

export type ResolveSeasonOfferInput = {
  enabled: boolean;
  tiers: Record<PublicFounderTier, FounderTierConfig>;
  user: FounderCheckoutUser | null;
  claimedCount: number;
  programOpen: boolean;
  taxSeason: string;
};

export type ResolveSeasonOfferForActorInput = ResolveSeasonOfferInput & {
  actor: Actor | null;
  verfyUser: string;
};

/** Flag-driven season display + checkout tier (founder seats 1–50, else DEFAULT). */
export function resolveSeasonOfferFromState(
  input: ResolveSeasonOfferInput,
): SeasonOffer {
  if (!input.enabled) {
    const tier: PublicFounderTier = "DEFAULT";
    return {
      priceUsd: input.tiers[tier].priceUsd,
      priceCents: input.tiers[tier].priceCents,
      skuTier: tier,
      taxSeason: input.taxSeason,
    };
  }

  const resolution = resolveFounderCheckoutSkuTier({
    user: input.user,
    claimedCount: input.claimedCount,
    programOpen: input.programOpen,
  });
  const skuTier: PublicFounderTier = resolution.ok ? resolution.skuTier : "DEFAULT";
  const tierConfig = input.tiers[skuTier];

  return {
    priceUsd: tierConfig.priceUsd,
    priceCents: tierConfig.priceCents,
    skuTier,
    taxSeason: input.taxSeason,
  };
}

export function resolveSeasonOfferForActor(
  input: ResolveSeasonOfferForActorInput,
): SeasonOffer {
  if (
    input.actor &&
    resolveSpecialCheckoutEligible(input.actor, input.verfyUser)
  ) {
    return buildSpecialSeasonOffer(input.taxSeason);
  }
  return resolveSeasonOfferFromState(input);
}

export async function getSeasonOffer(
  userId?: string,
  options?: { actor?: Actor | null; verfyUser?: string },
): Promise<SeasonOffer> {
  const config = await resolveFounderProgramConfig();
  const state = await getFounderProgramState(userId);
  const taxSeason = currentTaxSeason();
  const verfyUser = options?.verfyUser ?? "";

  return resolveSeasonOfferForActor({
    actor: options?.actor ?? null,
    verfyUser,
    enabled: config.enabled,
    tiers: config.tiers,
    user: state.user,
    claimedCount: state.claimedCount,
    programOpen: state.programOpen,
    taxSeason,
  });
}
