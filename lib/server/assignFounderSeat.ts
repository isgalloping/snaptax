import { nextSeatNumber, tierForSeat } from "@/lib/founder/tiers";
import type { FounderTier } from "@/lib/founder/types";
import { prisma } from "@/lib/prisma";
import { utcNow } from "@/lib/time/utc";

export type AssignFounderSeatResult = {
  assigned: boolean;
  founderNumber: number | null;
  tier: FounderTier | null;
};

export type AssignFounderSeatDeps = {
  runTransaction?: <T>(fn: () => Promise<T>) => Promise<T>;
  findUser?: (userId: string) => Promise<{ founderNumber: number | null } | null>;
  countClaimedSeats?: () => Promise<number>;
  assignSeat?: (
    userId: string,
    data: {
      founderNumber: number;
      founderTier: FounderTier;
      founderStatus: "active";
      founderLockedAt: Date;
    },
  ) => Promise<void>;
  now?: () => Date;
};

async function assignFounderSeatCore(
  userId: string,
  deps: AssignFounderSeatDeps,
): Promise<AssignFounderSeatResult> {
  const now = deps.now ?? utcNow;

  const findUser =
    deps.findUser ??
    (async (id) =>
      prisma.snaptaxUser.findUnique({
        where: { id },
        select: { founderNumber: true },
      }));

  const countClaimedSeats =
    deps.countClaimedSeats ??
    (async () =>
      prisma.snaptaxUser.count({
        where: { founderNumber: { not: null } },
      }));

  const assignSeat =
    deps.assignSeat ??
    (async (id, data) => {
      await prisma.snaptaxUser.update({
        where: { id },
        data,
      });
    });

  const user = await findUser(userId);
  if (user?.founderNumber != null) {
    return {
      assigned: false,
      founderNumber: user.founderNumber,
      tier: tierForSeat(user.founderNumber),
    };
  }

  const claimedCount = await countClaimedSeats();
  const seat = nextSeatNumber(claimedCount);
  if (seat == null) {
    return { assigned: false, founderNumber: null, tier: null };
  }

  const tier = tierForSeat(seat)!;
  await assignSeat(userId, {
    founderNumber: seat,
    founderTier: tier,
    founderStatus: "active",
    founderLockedAt: now(),
  });

  return { assigned: true, founderNumber: seat, tier };
}

export async function assignFounderSeatOnFirstPurchase(
  userId: string,
  deps: AssignFounderSeatDeps = {},
): Promise<AssignFounderSeatResult> {
  if (deps.runTransaction) {
    return deps.runTransaction(() => assignFounderSeatCore(userId, deps));
  }

  return prisma.$transaction(async (tx) => {
    const txDeps: AssignFounderSeatDeps = {
      findUser: (id) =>
        tx.snaptaxUser.findUnique({
          where: { id },
          select: { founderNumber: true },
        }),
      countClaimedSeats: () =>
        tx.snaptaxUser.count({
          where: { founderNumber: { not: null } },
        }),
      assignSeat: (id, data) =>
        tx.snaptaxUser.update({
          where: { id },
          data,
        }),
      now: deps.now ?? utcNow,
    };
    return assignFounderSeatCore(userId, txDeps);
  });
}
