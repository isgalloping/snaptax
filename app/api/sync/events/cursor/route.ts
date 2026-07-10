import { NextResponse } from "next/server";
import { loadReceiptSyncCursor } from "@/lib/server/receiptSyncCursor";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

async function resolveActor(req: Request) {
  return getActor(req, { requireWrite: false });
}

export const GET = withRequestLog(
  "api.sync",
  async (request, _context) => {
    try {
      const actor = await getActor(request, { requireWrite: false });
      const cursor = await loadReceiptSyncCursor(actor);
      if (!cursor) {
        return NextResponse.json({ cursor: null });
      }
      return NextResponse.json({
        cursor: {
          lastEventId: cursor.lastEventId,
          lastClientCreatedAtMs: cursor.lastClientCreatedAtMs,
        },
      });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
  { getActor: resolveActor },
);
