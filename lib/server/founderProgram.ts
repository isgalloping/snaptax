import { prisma } from "@/lib/prisma";
import { currentTaxSeason } from "@/lib/tax/season";
import type { FounderStatus, FounderTier } from "@/lib/founder/types";
import { FOUNDER_SEATS_TOTAL } from "@/lib/founder/types";
import { nextSeatNumber, tierForSeat } from "@/lib/founder/tiers";
import { resolveFounderProgramConfig } from "@/lib/server/founderConfig";

export type FounderCheckoutUser = {
  founderStatus: FounderStatus;
  founderTier: FounderTier | null;
  founderNumber: number | null;
};

export type ResolveFounderCheckoutSkuTierInput = {
  user: FounderCheckoutUser | null;
  claimedCount: number;
  programOpen: boolean;
};

export type ResolveFounderCheckoutSkuTierResult =
  | { ok: true; skuTier: FounderTier }
  | { ok: false; error: "FOUNDER_PROGRAM_FULL" };

export function resolveFounderCheckoutSkuTier(
  input: ResolveFounderCheckoutSkuTierInput,
): ResolveFounderCheckoutSkuTierResult {
  const { user, claimedCount, programOpen } = input;

  if (user?.founderNumber != null) {
    const status = user.founderStatus;
    if (
      (status === "active" || status === "lapsed") &&
      user.founderTier != null
    ) {
      return { ok: true, skuTier: user.founderTier };
    }
  }

  if (user?.founderNumber == null) {
    const nextSeat = nextSeatNumber(claimedCount);
    if (nextSeat != null) {
      const tier = tierForSeat(nextSeat);
      if (tier != null) {
        return { ok: true, skuTier: tier };
      }
    }
    if (!programOpen) {
      return { ok: false, error: "FOUNDER_PROGRAM_FULL" };
    }
    return { ok: true, skuTier: "DEFAULT" };
  }

  return { ok: true, skuTier: "DEFAULT" };
}

export function normalizeFounderStatus(
  status: string | null | undefined,
): FounderStatus {
  return status === "active" || status === "lapsed" ? status : "none";
}

export async function getFounderProgramState(userId?: string) {
  const config = await resolveFounderProgramConfig();
  const claimedCount = await prisma.snaptaxUser.count({
    where: { founderNumber: { not: null } },
  });

  const user = userId
    ? await prisma.snaptaxUser.findUnique({
        where: { id: userId },
        select: {
          founderNumber: true,
          founderTier: true,
          founderStatus: true,
          seasonEntitlements: {
            where: { taxSeason: currentTaxSeason() },
            take: 1,
            select: { id: true },
          },
        },
      })
    : null;

  const founderStatus = normalizeFounderStatus(user?.founderStatus);

  return {
    enabled: config.enabled,
    seatsTotal: FOUNDER_SEATS_TOTAL,
    claimedCount,
    remaining: Math.max(0, FOUNDER_SEATS_TOTAL - claimedCount),
    programOpen: config.enabled && claimedCount < FOUNDER_SEATS_TOTAL,
    tiers: config.tiers,
    user: user
      ? {
          founderStatus,
          founderTier: (user.founderTier as FounderTier | null) ?? null,
          founderNumber: user.founderNumber,
          currentSeasonEntitled: user.seasonEntitlements.length > 0,
        }
      : null,
  };
}
