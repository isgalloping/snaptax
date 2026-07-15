import { prisma } from "@/lib/prisma";
import { utcNow } from "@/lib/time/utc";

export type RestoreSeasonEntitlementResult = {
  ok: boolean;
  reason: string;
};

export type RestoreSeasonEntitlementDeps = {
  find?: (
    userId: string,
    taxSeason: string,
  ) => Promise<{ id: string; status: string } | null>;
  update?: (
    id: string,
    data: {
      status: "active";
      statusReason: string;
      statusUpdatedAt: Date;
    },
  ) => Promise<void>;
  now?: () => Date;
};

export async function restoreSeasonEntitlementActive(
  input: {
    userId: string;
    taxSeason: string;
    reason?: string;
  },
  deps: RestoreSeasonEntitlementDeps = {},
): Promise<RestoreSeasonEntitlementResult> {
  const find =
    deps.find ??
    (async (userId, taxSeason) =>
      prisma.snaptaxSeasonEntitlement.findUnique({
        where: { userId_taxSeason: { userId, taxSeason } },
        select: { id: true, status: true },
      }));
  const update =
    deps.update ??
    (async (id, data) => {
      await prisma.snaptaxSeasonEntitlement.update({
        where: { id },
        data,
      });
    });
  const now = deps.now ?? utcNow;

  const row = await find(input.userId, input.taxSeason);
  if (!row) {
    return { ok: false, reason: "not_found" };
  }
  if (row.status === "refunded") {
    return { ok: false, reason: "refunded_use_repurchase" };
  }
  if (row.status === "active") {
    return { ok: false, reason: "already_active" };
  }
  if (row.status !== "disputed") {
    return { ok: false, reason: "unexpected_status" };
  }

  await update(row.id, {
    status: "active",
    statusReason: input.reason ?? "manual_restore",
    statusUpdatedAt: now(),
  });

  return { ok: true, reason: "manual_restore" };
}
