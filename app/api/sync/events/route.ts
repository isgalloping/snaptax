import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, mapErrorToResponse, rateLimitError } from "@/lib/api/errors";
import {
  checkActorSyncEventsLimit,
  checkIpSyncEventsLimit,
  clientIp,
} from "@/lib/api/rateLimit";
import { getActor } from "@/lib/auth/getActor";
import { buildReceiptEventIngestPayload, uniqueTaxCalculatedReceiptIds } from "@/lib/server/buildReceiptEventIngestPayload";
import { ingestReceiptEventBatch } from "@/lib/server/ingestReceiptEventBatch";
import { maybePruneOldReceiptEvents } from "@/lib/server/pruneReceiptEvents";
import { prisma } from "@/lib/prisma";
import { receiptWhereForActor } from "@/lib/receipts/ownership";
import { SYNC_EVENTS_ACTOR_OPTIONS } from "@/lib/server/syncEventsActorOptions";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { RECEIPT_EVENT_BATCH_SIZE } from "@/lib/storage/receiptEventTypes";

const eventSchema = z.object({
  id: z.string().uuid(),
  receiptId: z.string().uuid(),
  type: z.enum(["RECEIPT_CREATED", "OCR_COMPLETED", "TAX_CALCULATED"]),
  payload: z.record(z.string(), z.unknown()).default({}),
  createdAtMs: z.number().int().positive(),
});

const bodySchema = z.object({
  events: z.array(eventSchema).min(1).max(RECEIPT_EVENT_BATCH_SIZE),
});

async function resolveActor(req: Request) {
  return getActor(req, SYNC_EVENTS_ACTOR_OPTIONS);
}

export const POST = withRequestLog(
  "api.sync",
  async (request, _context) => {
    try {
      const actor = await getActor(request, SYNC_EVENTS_ACTOR_OPTIONS);
      const ip = clientIp(request);
      const ipLimit = await checkIpSyncEventsLimit(ip);
      if (!ipLimit.ok) {
        return rateLimitError(ipLimit.retryAfterSec);
      }
      const actorLimit = await checkActorSyncEventsLimit(actor);
      if (!actorLimit.ok) {
        return rateLimitError(actorLimit.retryAfterSec);
      }

      const body = bodySchema.parse(await request.json());

      const taxCalculatedIds = uniqueTaxCalculatedReceiptIds(body.events);
      if (taxCalculatedIds.length > 0) {
        const ownedCount = await prisma.snaptaxReceipt.count({
          where: {
            id: { in: taxCalculatedIds },
            ...receiptWhereForActor(actor),
          },
        });
        if (ownedCount !== taxCalculatedIds.length) {
          return apiError(
            "INVALID_RECEIPT",
            "TAX_CALCULATED events must reference actor-owned receipts",
            403,
          );
        }
      }

      const { inserted, snapshotsInserted, cursor } = await ingestReceiptEventBatch(
        buildReceiptEventIngestPayload(actor, body.events),
      );

      await maybePruneOldReceiptEvents();

      return NextResponse.json({
        syncedIds: body.events.map((event) => event.id),
        inserted,
        snapshotsInserted,
        cursor: cursor
          ? {
              lastEventId: cursor.lastEventId,
              lastClientCreatedAtMs: cursor.lastClientCreatedAtMs,
            }
          : null,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return apiError("INVALID_BODY", "Invalid event batch", 400);
      }
      return mapErrorToResponse(err);
    }
  },
  { getActor: resolveActor },
);
