import type { Actor } from "@/lib/auth/getActor";
import { prisma } from "@/lib/prisma";

export type ReceiptSyncCursorState = {
  lastEventId: string;
  lastClientCreatedAtMs: number;
};

export type ReceiptSyncCursorEvent = {
  id: string;
  clientCreatedAtMs: number;
};

export function advanceReceiptSyncCursor(
  current: ReceiptSyncCursorState | null,
  events: ReceiptSyncCursorEvent[],
): ReceiptSyncCursorState | null {
  let next = current;
  for (const event of events) {
    if (
      !next ||
      event.clientCreatedAtMs > next.lastClientCreatedAtMs ||
      (event.clientCreatedAtMs === next.lastClientCreatedAtMs &&
        event.id > next.lastEventId)
    ) {
      next = {
        lastEventId: event.id,
        lastClientCreatedAtMs: event.clientCreatedAtMs,
      };
    }
  }
  return next;
}

export function shouldAdvanceReceiptSyncCursor(
  current: ReceiptSyncCursorState | null,
  next: ReceiptSyncCursorState,
): boolean {
  if (!current) return true;
  if (next.lastClientCreatedAtMs > current.lastClientCreatedAtMs) return true;
  if (
    next.lastClientCreatedAtMs === current.lastClientCreatedAtMs &&
    next.lastEventId > current.lastEventId
  ) {
    return true;
  }
  return false;
}

type SyncCursorDb = Pick<typeof prisma, "snaptaxReceiptSyncCursor">;

function actorKeys(actor: Actor): { userId: string | null; ghostId: string | null } {
  if (actor.kind === "user") {
    return { userId: actor.userId, ghostId: null };
  }
  return { userId: null, ghostId: actor.ghostId };
}

export async function loadReceiptSyncCursor(
  actor: Actor,
  db: SyncCursorDb = prisma,
): Promise<ReceiptSyncCursorState | null> {
  const keys = actorKeys(actor);
  const row = keys.userId
    ? await db.snaptaxReceiptSyncCursor.findUnique({
        where: { userId: keys.userId },
      })
    : await db.snaptaxReceiptSyncCursor.findUnique({
        where: { ghostId: keys.ghostId! },
      });
  if (!row) return null;
  return {
    lastEventId: row.lastEventId,
    lastClientCreatedAtMs: row.lastClientCreatedAt.getTime(),
  };
}

export async function upsertReceiptSyncCursor(
  actor: Actor,
  next: ReceiptSyncCursorState,
  db: SyncCursorDb = prisma,
): Promise<ReceiptSyncCursorState> {
  const existing = await loadReceiptSyncCursor(actor, db);
  if (existing && !shouldAdvanceReceiptSyncCursor(existing, next)) {
    return existing;
  }

  const keys = actorKeys(actor);
  const lastClientCreatedAt = new Date(next.lastClientCreatedAtMs);
  if (keys.userId) {
    await db.snaptaxReceiptSyncCursor.upsert({
      where: { userId: keys.userId },
      create: {
        userId: keys.userId,
        lastEventId: next.lastEventId,
        lastClientCreatedAt,
      },
      update: {
        lastEventId: next.lastEventId,
        lastClientCreatedAt,
      },
    });
  } else {
    await db.snaptaxReceiptSyncCursor.upsert({
      where: { ghostId: keys.ghostId! },
      create: {
        ghostId: keys.ghostId!,
        lastEventId: next.lastEventId,
        lastClientCreatedAt,
      },
      update: {
        lastEventId: next.lastEventId,
        lastClientCreatedAt,
      },
    });
  }
  return next;
}

export async function advanceActorReceiptSyncCursor(
  actor: Actor,
  events: ReceiptSyncCursorEvent[],
  db: SyncCursorDb = prisma,
): Promise<ReceiptSyncCursorState | null> {
  const existing = await loadReceiptSyncCursor(actor, db);
  const next = advanceReceiptSyncCursor(existing, events);
  if (!next || !shouldAdvanceReceiptSyncCursor(existing, next)) {
    return existing;
  }
  return upsertReceiptSyncCursor(actor, next, db);
}
