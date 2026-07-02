import type { FounderTier } from "@/lib/founder/types";
import {
  founderPriceDefaultCentsFlag,
  founderPriceEarlyCentsFlag,
  founderPriceFounderCentsFlag,
  founderPriceSuperCentsFlag,
  founderProgramEnabledFlag,
} from "@/flags/founder";
import { getPaddlePriceId, getPaddlePriceIdForFounderTier } from "@/lib/server/env";

export type FounderTierConfig = {
  priceCents: number;
  paddlePriceId: string;
  seatRange: [number, number] | null;
};

export type FounderProgramConfig = {
  enabled: boolean;
  tiers: Record<FounderTier, FounderTierConfig>;
};

export function buildFounderTierConfigs(priceCents: Record<FounderTier, number>): Record<
  FounderTier,
  FounderTierConfig
> {
  return {
    FOUNDER_LEVEL_SUPER: {
      priceCents: priceCents.FOUNDER_LEVEL_SUPER,
      paddlePriceId: getPaddlePriceIdForFounderTier("FOUNDER_LEVEL_SUPER"),
      seatRange: [1, 10],
    },
    EARLY: {
      priceCents: priceCents.EARLY,
      paddlePriceId: getPaddlePriceIdForFounderTier("EARLY"),
      seatRange: [11, 30],
    },
    FOUNDER: {
      priceCents: priceCents.FOUNDER,
      paddlePriceId: getPaddlePriceIdForFounderTier("FOUNDER"),
      seatRange: [31, 50],
    },
    DEFAULT: {
      priceCents: priceCents.DEFAULT,
      paddlePriceId: getPaddlePriceId(),
      seatRange: null,
    },
  };
}

export async function resolveFounderProgramConfig(): Promise<FounderProgramConfig> {
  const enabled = await founderProgramEnabledFlag();
  const priceCents: Record<FounderTier, number> = {
    FOUNDER_LEVEL_SUPER: await founderPriceSuperCentsFlag(),
    EARLY: await founderPriceEarlyCentsFlag(),
    FOUNDER: await founderPriceFounderCentsFlag(),
    DEFAULT: await founderPriceDefaultCentsFlag(),
  };

  return {
    enabled,
    tiers: buildFounderTierConfigs(priceCents),
  };
}
