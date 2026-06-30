import { NextRequest, NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { prisma } from "@/lib/prisma";
import { serializeReceipt } from "@/lib/receipts/serialize";
import {
  buildSyncWhere,
  decodeSyncCursor,
  defaultSyncSince,
  encodeSyncCursor,
  parseSyncLimit,
} from "@/lib/receipts/syncQuery";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { parseUtcISOString } from "@/lib/time/utc";

async function resolveActor(req: NextRequest) {
  return getActor(req, { requireWrite: false });
}

export const GET = withRequestLog(
  "api.receipt",
  async (request, _context) => {
    try {
      const actor = await getActor(request);
      const params = new URL(request.url).searchParams;

      const sinceRaw = params.get("since");
      const since = sinceRaw ? parseUtcISOString(sinceRaw) : defaultSyncSince();

      const cursorRaw = params.get("cursor");
      const cursor = cursorRaw ? decodeSyncCursor(cursorRaw) : undefined;

      const limit = parseSyncLimit(params.get("limit"));

      const rows = await prisma.snaptaxReceipt.findMany({
        where: buildSyncWhere(actor, since, cursor),
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      });

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      const last = page[page.length - 1];
      const nextCursor =
        hasMore && last ? encodeSyncCursor(last.updatedAt, last.id) : null;

      return NextResponse.json({
        receipts: page.map(serializeReceipt),
        nextCursor,
        hasMore,
      });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
  { getActor: resolveActor },
);
