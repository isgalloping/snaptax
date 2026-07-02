import { prisma } from "@/lib/prisma";
import { currentTaxSeason } from "@/lib/tax/season";
import type { FounderStatus, FounderTier } from "@/lib/founder/types";
import { FOUNDER_SEATS_TOTAL } from "@/lib/founder/types";
import { resolveFounderProgramConfig } from "@/lib/server/founderConfig";

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
