import { prisma } from "@/lib/prisma";
import { utcNow } from "@/lib/time/utc";
import {
  nextEntitlementStatus,
  type EntitlementAdjustmentAction,
  type SeasonEntitlementStatus,
} from "@/lib/billing/entitlementStatus";

export type ApplySeasonEntitlementAdjustmentInput = {
  transactionId: string;
  action: EntitlementAdjustmentAction;
  adjustmentStatus?: string | null;
};

export type ApplySeasonEntitlementAdjustmentResult = {
  applied: boolean;
  reason: string;
  entitlementId?: string;
  statusBefore?: string;
  statusAfter?: string;
};

export type ApplySeasonEntitlementAdjustmentDeps = {
  findByTransaction?: (
    transactionId: string,
  ) => Promise<{ id: string; status: string } | null>;
  updateStatus?: (
    id: string,
    data: {
      status: SeasonEntitlementStatus;
      statusReason: string;
      statusUpdatedAt: Date;
    },
  ) => Promise<void>;
  now?: () => Date;
};

export async function applySeasonEntitlementAdjustment(
  input: ApplySeasonEntitlementAdjustmentInput,
  deps: ApplySeasonEntitlementAdjustmentDeps = {},
): Promise<ApplySeasonEntitlementAdjustmentResult> {
  const findByTransaction =
    deps.findByTransaction ??
    (async (transactionId) =>
      prisma.snaptaxSeasonEntitlement.findUnique({
        where: { transactionId },
        select: { id: true, status: true },
      }));

  const updateStatus =
    deps.updateStatus ??
    (async (id, data) => {
      await prisma.snaptaxSeasonEntitlement.update({
        where: { id },
        data: {
          status: data.status,
          statusReason: data.statusReason,
          statusUpdatedAt: data.statusUpdatedAt,
        },
      });
    });

  const now = deps.now ?? utcNow;
  const row = await findByTransaction(input.transactionId);
  if (!row) {
    return { applied: false, reason: "txn_not_found" };
  }

  const current = row.status as SeasonEntitlementStatus;
  const decision = nextEntitlementStatus({
    current,
    action: input.action,
    adjustmentStatus: input.adjustmentStatus,
  });

  if (!decision.applied) {
    return {
      applied: false,
      reason: decision.reason,
      entitlementId: row.id,
      statusBefore: row.status,
      statusAfter: row.status,
    };
  }

  await updateStatus(row.id, {
    status: decision.next,
    statusReason: decision.reason,
    statusUpdatedAt: now(),
  });

  return {
    applied: true,
    reason: decision.reason,
    entitlementId: row.id,
    statusBefore: row.status,
    statusAfter: decision.next,
  };
}
