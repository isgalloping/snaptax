import { prisma } from "@/lib/prisma";
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
};

type SeasonEntitlementRow = {
  id: string;
  transactionId: string;
  status?: string;
};

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
    await updateEntitlement(existingBySeason.id, activePatch);
    return {
      created: false,
      duplicateSeason: existingBySeason.transactionId !== input.transactionId,
      transactionId: input.transactionId,
    };
  }

  const existingByTxn = await findByTransaction(input.transactionId);
  if (existingByTxn) {
    await updateEntitlement(existingByTxn.id, activePatch);
    return {
      created: false,
      duplicateSeason: false,
      transactionId: input.transactionId,
    };
  }

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

  return {
    created: true,
    duplicateSeason: false,
    transactionId: input.transactionId,
  };
}
