import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type EventStoreActorScope = {
  userId?: string | null;
  ghostIds?: string[];
};

function eventStoreActorOrClauses(
  scope: EventStoreActorScope,
): Array<{ userId?: string; ghostId?: string }> {
  const or: Array<{ userId?: string; ghostId?: string }> = [];
  if (scope.userId) {
    or.push({ userId: scope.userId });
  }
  for (const ghostId of scope.ghostIds ?? []) {
    or.push({ ghostId });
  }
  return or;
}

export function eventStoreActorWhere(
  scope: EventStoreActorScope,
): Prisma.SnaptaxReceiptEventWhereInput {
  const or = eventStoreActorOrClauses(scope);
  if (or.length === 0) {
    return { id: { in: [] } };
  }
  if (or.length === 1) return or[0]!;
  return { OR: or };
}

function eventStoreSnapshotActorWhere(
  scope: EventStoreActorScope,
): Prisma.SnaptaxReceiptLifecycleSnapshotWhereInput {
  const or = eventStoreActorOrClauses(scope);
  if (or.length === 0) {
    return { id: { in: [] } };
  }
  if (or.length === 1) return or[0]!;
  return { OR: or };
}

type EventStoreDb = Pick<
  typeof prisma,
  | "snaptaxReceiptEvent"
  | "snaptaxReceiptLifecycleSnapshot"
  | "snaptaxReceiptSyncCursor"
>;

export async function deleteEventStoreRecords(
  scope: EventStoreActorScope,
  db: EventStoreDb = prisma,
): Promise<{ events: number; snapshots: number; cursors: number }> {
  const eventWhere = eventStoreActorWhere(scope);
  const snapshotWhere = eventStoreSnapshotActorWhere(scope);
  const [events, snapshots] = await Promise.all([
    db.snaptaxReceiptEvent.deleteMany({ where: eventWhere }),
    db.snaptaxReceiptLifecycleSnapshot.deleteMany({ where: snapshotWhere }),
  ]);

  let cursors = 0;
  if (scope.userId) {
    const result = await db.snaptaxReceiptSyncCursor.deleteMany({
      where: { userId: scope.userId },
    });
    cursors += result.count;
  }
  for (const ghostId of scope.ghostIds ?? []) {
    const result = await db.snaptaxReceiptSyncCursor.deleteMany({
      where: { ghostId },
    });
    cursors += result.count;
  }

  return {
    events: events.count,
    snapshots: snapshots.count,
    cursors,
  };
}
