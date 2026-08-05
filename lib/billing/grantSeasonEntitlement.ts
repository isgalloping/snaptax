import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { utcNow } from "@/lib/time/utc";

export type GrantPaddleSeasonEntitlementInput = {
  userId: string;
  taxSeason: string;
  transactionId: string;
  amountUsd: number;
};

export type GrantPaddleSeasonEntitlementResult = {
  created: boolean;
  duplicateSeason: boolean;
  transactionId: string;
  /** Refunded/disputed entitlement replayed with the same Paddle transaction id. */
  skippedReplay?: boolean;
  /** Active season already paid; a different transaction id was ignored to preserve refund linkage. */
  skippedDuplicatePurchase?: boolean;
};

type SeasonEntitlementRow = {
  id: string;
  transactionId: string;
  status?: string;
};

const REVOKED_ENTITLEMENT_STATUSES = new Set(["refunded", "disputed"]);

function shouldSkipRevokedReplay(
  existing: SeasonEntitlementRow,
  transactionId: string,
): boolean {
  const status = existing.status?.trim();
  return (
    status != null &&
    REVOKED_ENTITLEMENT_STATUSES.has(status) &&
    existing.transactionId === transactionId
  );
}

function shouldSkipActiveDuplicatePurchase(
  existing: SeasonEntitlementRow,
  transactionId: string,
): boolean {
  return existing.status?.trim() === "active" && existing.transactionId !== transactionId;
}

export type GrantSeasonEntitlementDeps = {
  findBySeason?: (
    userId: string,
    taxSeason: string,
  ) => Promise<SeasonEntitlementRow | null>;
  findByTransaction?: (
    transactionId: string,
  ) => Promise<SeasonEntitlementRow | null>;
  updateEntitlement?: (
    id: string,
    data: {
      paidAt: Date;
      amount: number;
      transactionId: string;
      status: "active";
      statusReason: string;
      statusUpdatedAt: Date;
    },
  ) => Promise<void>;
  createEntitlement?: (data: {
    userId: string;
    taxSeason: string;
    transactionId: string;
    paidAt: Date;
    amount: number;
    channelCode: string;
    status: "active";
    statusReason: string;
    statusUpdatedAt: Date;
  }) => Promise<void>;
  now?: () => Date;
};

export async function grantPaddleSeasonEntitlement(
  input: GrantPaddleSeasonEntitlementInput,
  deps: GrantSeasonEntitlementDeps = {},
): Promise<GrantPaddleSeasonEntitlementResult> {
  const paidAt = deps.now?.() ?? utcNow();
  const amount = input.amountUsd;
  const statusUpdatedAt = paidAt;

  const findBySeason =
    deps.findBySeason ??
    (async (userId, taxSeason) =>
      prisma.snaptaxSeasonEntitlement.findUnique({
        where: { userId_taxSeason: { userId, taxSeason } },
        select: { id: true, transactionId: true, status: true },
      }));

  const findByTransaction =
    deps.findByTransaction ??
    (async (transactionId) =>
      prisma.snaptaxSeasonEntitlement.findUnique({
        where: { transactionId },
        select: { id: true, transactionId: true, status: true },
      }));

  const updateEntitlement =
    deps.updateEntitlement ??
    (async (id, data) => {
      await prisma.snaptaxSeasonEntitlement.update({
        where: { id },
        data: {
          paidAt: data.paidAt,
          amount: data.amount,
          transactionId: data.transactionId,
          status: data.status,
          statusReason: data.statusReason,
          statusUpdatedAt: data.statusUpdatedAt,
        },
      });
    });

  const createEntitlement =
    deps.createEntitlement ??
    (async (data) => {
      await prisma.snaptaxSeasonEntitlement.create({ data });
    });

  const activePatch = {
    paidAt,
    amount,
    transactionId: input.transactionId,
    status: "active" as const,
    statusReason: "purchase_completed",
    statusUpdatedAt,
  };

  const existingBySeason = await findBySeason(input.userId, input.taxSeason);
  if (existingBySeason) {
    if (shouldSkipRevokedReplay(existingBySeason, input.transactionId)) {
      return {
        created: false,
        duplicateSeason: false,
        transactionId: input.transactionId,
        skippedReplay: true,
      };
    }
    if (shouldSkipActiveDuplicatePurchase(existingBySeason, input.transactionId)) {
      return {
        created: false,
        duplicateSeason: true,
        transactionId: existingBySeason.transactionId,
        skippedDuplicatePurchase: true,
      };
    }
    await updateEntitlement(existingBySeason.id, activePatch);
    return {
      created: false,
      duplicateSeason: existingBySeason.transactionId !== input.transactionId,
      transactionId: input.transactionId,
    };
  }

  const existingByTxn = await findByTransaction(input.transactionId);
  if (existingByTxn) {
    if (shouldSkipRevokedReplay(existingByTxn, input.transactionId)) {
      return {
        created: false,
        duplicateSeason: false,
        transactionId: input.transactionId,
        skippedReplay: true,
      };
    }
    await updateEntitlement(existingByTxn.id, activePatch);
    return {
      created: false,
      duplicateSeason: false,
      transactionId: input.transactionId,
    };
  }

  try {
    await createEntitlement({
      userId: input.userId,
      taxSeason: input.taxSeason,
      transactionId: input.transactionId,
      paidAt,
      amount,
      channelCode: "paddle",
      status: "active",
      statusReason: "purchase_completed",
      statusUpdatedAt,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const raced =
        (await findBySeason(input.userId, input.taxSeason)) ??
        (await findByTransaction(input.transactionId));
      if (!raced) throw err;
      if (shouldSkipRevokedReplay(raced, input.transactionId)) {
        return {
          created: false,
          duplicateSeason: false,
          transactionId: input.transactionId,
          skippedReplay: true,
        };
      }
      if (shouldSkipActiveDuplicatePurchase(raced, input.transactionId)) {
        return {
          created: false,
          duplicateSeason: true,
          transactionId: raced.transactionId,
          skippedDuplicatePurchase: true,
        };
      }
      await updateEntitlement(raced.id, activePatch);
      return {
        created: false,
        duplicateSeason: raced.transactionId !== input.transactionId,
        transactionId: input.transactionId,
      };
    }
    throw err;
  }

  return {
    created: true,
    duplicateSeason: false,
    transactionId: input.transactionId,
  };
}

export async function grantSeasonPurchaseWithIntentConsume(params: {
  grant: GrantPaddleSeasonEntitlementInput;
  intentId?: string;
  skipIntentConsume?: boolean;
}): Promise<GrantPaddleSeasonEntitlementResult> {
  return prisma.$transaction(async (tx) => {
    const entitlement = await grantPaddleSeasonEntitlement(params.grant, {
      findBySeason: (userId, taxSeason) =>
        tx.snaptaxSeasonEntitlement.findUnique({
          where: { userId_taxSeason: { userId, taxSeason } },
          select: { id: true, transactionId: true, status: true },
        }),
      findByTransaction: (transactionId) =>
        tx.snaptaxSeasonEntitlement.findUnique({
          where: { transactionId },
          select: { id: true, transactionId: true, status: true },
        }),
      updateEntitlement: async (id, data) => {
        await tx.snaptaxSeasonEntitlement.update({
          where: { id },
          data: {
            paidAt: data.paidAt,
            amount: data.amount,
            transactionId: data.transactionId,
            status: data.status,
            statusReason: data.statusReason,
            statusUpdatedAt: data.statusUpdatedAt,
          },
        });
      },
      createEntitlement: async (data) => {
        await tx.snaptaxSeasonEntitlement.create({ data });
      },
    });

    if (params.intentId && !params.skipIntentConsume) {
      await tx.snaptaxCheckoutIntent.update({
        where: { id: params.intentId },
        data: {
          status: "consumed",
          transactionId: params.grant.transactionId,
        },
      });
    }

    return entitlement;
  });
}
