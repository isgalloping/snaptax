import { nextSeatNumber, tierForSeat } from "./tiers";
import type { FounderStatus, FounderTier } from "./types";

export type FounderDisplayTierInput = {
  claimedCount: number;
  user: {
    founderStatus: FounderStatus;
    founderTier: FounderTier | null;
    founderNumber: number | null;
  } | null;
};

/** Tier shown in founder widget / sheet for the current viewer. */
export function resolveDisplayTier(input: FounderDisplayTierInput): FounderTier {
  const user = input.user;

  if (user?.founderNumber != null) {
    const status = user.founderStatus;
    if (
      (status === "active" || status === "lapsed") &&
      user.founderTier != null
    ) {
      return user.founderTier;
    }
  }

  if (user?.founderNumber == null) {
    const nextSeat = nextSeatNumber(input.claimedCount);
    if (nextSeat != null) {
      const tier = tierForSeat(nextSeat);
      if (tier != null) {
        return tier;
      }
    }
  }

  return "DEFAULT";
}
