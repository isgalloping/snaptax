import type { FounderTier } from "@/lib/founder/types";
import { founderPriceUsdToCents } from "@/lib/founder/pricing";
import {
  founderPriceDefaultFlag,
  founderPriceEarlyFlag,
  founderPriceFounderFlag,
  founderPriceSuperFlag,
  founderProgramEnabledFlag,
} from "@/flags/founder";
import { getPaddlePriceId, getPaddlePriceIdForFounderTier } from "@/lib/server/env";

export type FounderTierConfig = {
  /** Display / config unit: whole USD (e.g. 5 = $5.00). */
  priceUsd: number;
  /** Paddle webhook validation (integer cents). */
  priceCents: number;
  paddlePriceId: string;
  seatRange: [number, number] | null;
};

export type FounderProgramConfig = {
  enabled: boolean;
  tiers: Record<FounderTier, FounderTierConfig>;
};

export function buildFounderTierConfigs(priceUsd: Record<FounderTier, number>): Record<
  FounderTier,
  FounderTierConfig
> {
  const tier = (usd: number, paddleTier: FounderTier | "DEFAULT", seatRange: [number, number] | null) => ({
    priceUsd: usd,
    priceCents: founderPriceUsdToCents(usd),
    paddlePriceId:
      paddleTier === "DEFAULT"
        ? getPaddlePriceId()
        : getPaddlePriceIdForFounderTier(paddleTier),
    seatRange,
  });

  return {
    FOUNDER_LEVEL_SUPER: tier(priceUsd.FOUNDER_LEVEL_SUPER, "FOUNDER_LEVEL_SUPER", [1, 10]),
    EARLY: tier(priceUsd.EARLY, "EARLY", [11, 30]),
    FOUNDER: tier(priceUsd.FOUNDER, "FOUNDER", [31, 50]),
    DEFAULT: tier(priceUsd.DEFAULT, "DEFAULT", null),
  };
}

export async function resolveFounderProgramConfig(): Promise<FounderProgramConfig> {
  const enabled = await founderProgramEnabledFlag();
  const priceUsd: Record<FounderTier, number> = {
    FOUNDER_LEVEL_SUPER: await founderPriceSuperFlag(),
    EARLY: await founderPriceEarlyFlag(),
    FOUNDER: await founderPriceFounderFlag(),
    DEFAULT: await founderPriceDefaultFlag(),
  };

  return {
    enabled,
    tiers: buildFounderTierConfigs(priceUsd),
  };
}
