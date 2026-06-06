import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/auth/getActor";
import { mapErrorToResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { assertReceiptAccess } from "@/lib/receipts/ownership";
import { serializeReceipt } from "@/lib/receipts/serialize";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

async function resolveActor(req: NextRequest) {
  return getActor(req);
}

export const GET = withRequestLog(
  "api.receipt",
  async (request, context) => {
    try {
      const { id } = await context.params;
      const actor = await getActor(request);
      const receipt = await prisma.snaptaxReceipt.findUnique({ where: { id } });
      if (!receipt) throw new Error("NOT_FOUND");
      assertReceiptAccess(receipt, actor);
      return NextResponse.json(serializeReceipt(receipt));
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
  { getActor: resolveActor },
);

export const DELETE = withRequestLog(
  "api.receipt",
  async (request, context) => {
    try {
      const { id } = await context.params;
      const actor = await getActor(request, { requireWrite: true });
      const receipt = await prisma.snaptaxReceipt.findUnique({ where: { id } });
      if (!receipt) throw new Error("NOT_FOUND");
      assertReceiptAccess(receipt, actor);
      await prisma.snaptaxReceipt.delete({ where: { id } });
      return new NextResponse(null, { status: 204 });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
  { getActor: resolveActor },
);
