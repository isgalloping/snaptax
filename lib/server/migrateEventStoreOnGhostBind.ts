import { prisma } from "@/lib/prisma";
import {
  advanceReceiptSyncCursor,
  shouldAdvanceReceiptSyncCursor,
  type ReceiptSyncCursorState,
} from "@/lib/server/receiptSyncCursor";

type EventStoreMigrateDb = Pick<
  typeof prisma,
  | "snaptaxReceiptEvent"
  | "snaptaxReceiptLifecycleSnapshot"
  | "snaptaxReceiptSyncCursor"
>;

function rowToCursorState(row: {
  lastEventId: string;
  lastClientCreatedAt: Date;
}): ReceiptSyncCursorState {
  return {
    lastEventId: row.lastEventId,
    lastClientCreatedAtMs: row.lastClientCreatedAt.getTime(),
  };
}

/** Reassign ghost-scoped Event Store rows to user on Google bind (mirrors receipt migration). */
export async function migrateEventStoreOnGhostBind(
  userId: string,
  ghostId: string,
  db: EventStoreMigrateDb = prisma,
): Promise<{ events: number; snapshots: number; cursorMerged: boolean }> {
  const [events, snapshots, ghostCursor, userCursor] = await Promise.all([
    db.snaptaxReceiptEvent.updateMany({
      where: { ghostId, userId: null },
      data: { userId },
    }),
    db.snaptaxReceiptLifecycleSnapshot.updateMany({
      where: { ghostId, userId: null },
      data: { userId },
    }),
    db.snaptaxReceiptSyncCursor.findUnique({ where: { ghostId } }),
    db.snaptaxReceiptSyncCursor.findUnique({ where: { userId } }),
  ]);

  let cursorMerged = false;
  if (ghostCursor) {
    const userState = userCursor ? rowToCursorState(userCursor) : null;
    const merged = advanceReceiptSyncCursor(userState, [
      {
        id: ghostCursor.lastEventId,
        clientCreatedAtMs: ghostCursor.lastClientCreatedAt.getTime(),
      },
    ]);
    if (merged && shouldAdvanceReceiptSyncCursor(userState, merged)) {
      await db.snaptaxReceiptSyncCursor.upsert({
        where: { userId },
        create: {
          userId,
          lastEventId: merged.lastEventId,
          lastClientCreatedAt: new Date(merged.lastClientCreatedAtMs),
        },
        update: {
          lastEventId: merged.lastEventId,
          lastClientCreatedAt: new Date(merged.lastClientCreatedAtMs),
        },
      });
      cursorMerged = true;
    }
    await db.snaptaxReceiptSyncCursor.deleteMany({ where: { ghostId } });
  }

  return {
    events: events.count,
    snapshots: snapshots.count,
    cursorMerged,
  };
}
