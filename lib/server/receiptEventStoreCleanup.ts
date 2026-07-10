import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type EventStoreActorScope = {
  userId?: string | null;
  ghostIds?: string[];
};

export function eventStoreActorWhere(
  scope: EventStoreActorScope,
): Prisma.SnaptaxReceiptEventWhereInput {
  const or: Prisma.SnaptaxReceiptEventWhereInput[] = [];
  if (scope.userId) {
    or.push({ userId: scope.userId });
  }
  for (const ghostId of scope.ghostIds ?? []) {
    or.push({ ghostId });
  }
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
  const where = eventStoreActorWhere(scope);
  const [events, snapshots] = await Promise.all([
    db.snaptaxReceiptEvent.deleteMany({ where }),
    db.snaptaxReceiptLifecycleSnapshot.deleteMany({ where }),
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
