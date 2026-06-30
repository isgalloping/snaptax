import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { prisma } from "@/lib/prisma";
import { receiptWhereForActor } from "@/lib/receipts/ownership";
import { serializeReceipt } from "@/lib/receipts/serialize";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

const RECONCILE_LIMIT = 50;

const bodySchema = z.object({
  ids: z.array(z.uuid()).max(RECONCILE_LIMIT),
});

async function resolveActor(req: NextRequest) {
  return getActor(req, { requireWrite: false });
}

export const POST = withRequestLog(
  "api.receipt",
  async (request, _context) => {
    try {
      const actor = await getActor(request);
      const { ids } = bodySchema.parse(await request.json());

      if (ids.length === 0) {
        return NextResponse.json({ receipts: [] });
      }

      const rows = await prisma.snaptaxReceipt.findMany({
        where: {
          ...receiptWhereForActor(actor),
          id: { in: ids },
        },
      });

      return NextResponse.json({
        receipts: rows.map(serializeReceipt),
      });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
  { getActor: resolveActor },
);
