import { Prisma } from "@prisma/client";
import { nextSeatNumber, tierForSeat } from "@/lib/founder/tiers";
import type { FounderTier } from "@/lib/founder/types";
import { prisma } from "@/lib/prisma";
import { utcNow } from "@/lib/time/utc";

export type AssignFounderSeatResult = {
  assigned: boolean;
  founderNumber: number | null;
  tier: FounderTier | null;
  /** Paid at seat boundary but no seat remained after conflict resolution. */
  seatUnavailable?: boolean;
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
  maxAttempts?: number;
};

function isFounderNumberUniqueViolation(err: unknown): boolean {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    const target = err.meta?.target;
    if (typeof target === "string") {
      return target.includes("founder_number");
    }
    if (Array.isArray(target)) {
      return target.includes("founder_number");
    }
  }
  return false;
}

async function assignFounderSeatCore(
  userId: string,
  deps: AssignFounderSeatDeps,
): Promise<AssignFounderSeatResult> {
  const now = deps.now ?? utcNow;
  const maxAttempts = deps.maxAttempts ?? 3;

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

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
      return {
        assigned: false,
        founderNumber: null,
        tier: null,
        seatUnavailable: true,
      };
    }

    const tier = tierForSeat(seat)!;
    try {
      await assignSeat(userId, {
        founderNumber: seat,
        founderTier: tier,
        founderStatus: "active",
        founderLockedAt: now(),
      });
      return { assigned: true, founderNumber: seat, tier };
    } catch (err) {
      if (isFounderNumberUniqueViolation(err) && attempt < maxAttempts - 1) {
        continue;
      }
      throw err;
    }
  }

  return {
    assigned: false,
    founderNumber: null,
    tier: null,
    seatUnavailable: true,
  };
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
      maxAttempts: deps.maxAttempts,
    };
    return assignFounderSeatCore(userId, txDeps);
  });
}
