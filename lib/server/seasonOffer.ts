import type { FounderTier } from "@/lib/founder/types";
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
};

export type ResolveSeasonOfferInput = {
  enabled: boolean;
  tiers: Record<FounderTier, FounderTierConfig>;
  user: FounderCheckoutUser | null;
  claimedCount: number;
  programOpen: boolean;
  taxSeason: string;
};

/** Flag-driven season display + checkout tier (founder seats 1–50, else DEFAULT). */
export function resolveSeasonOfferFromState(
  input: ResolveSeasonOfferInput,
): SeasonOffer {
  if (!input.enabled) {
    const tier: FounderTier = "DEFAULT";
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
  const skuTier: FounderTier = resolution.ok ? resolution.skuTier : "DEFAULT";
  const tierConfig = input.tiers[skuTier];

  return {
    priceUsd: tierConfig.priceUsd,
    priceCents: tierConfig.priceCents,
    skuTier,
    taxSeason: input.taxSeason,
  };
}

export async function getSeasonOffer(userId?: string): Promise<SeasonOffer> {
  const config = await resolveFounderProgramConfig();
  const state = await getFounderProgramState(userId);
  const taxSeason = currentTaxSeason();

  return resolveSeasonOfferFromState({
    enabled: config.enabled,
    tiers: config.tiers,
    user: state.user,
    claimedCount: state.claimedCount,
    programOpen: state.programOpen,
    taxSeason,
  });
}
