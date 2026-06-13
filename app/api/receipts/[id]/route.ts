import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/auth/getActor";
import { mapErrorToResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { assertReceiptAccess } from "@/lib/receipts/ownership";
import { serializeReceipt } from "@/lib/receipts/serialize";
import { updateReceiptCategory } from "@/lib/receipts/updateReceiptCategory";
import { US_EXPORT_CATEGORIES } from "@/lib/tax/usExportCategories";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

const patchBodySchema = z.object({
  category: z.enum(US_EXPORT_CATEGORIES),
});

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

export const PATCH = withRequestLog(
  "api.receipt",
  async (request, context) => {
    try {
      const { id } = await context.params;
      const actor = await getActor(request, { requireWrite: true });
      const receipt = await prisma.snaptaxReceipt.findUnique({ where: { id } });
      if (!receipt) throw new Error("NOT_FOUND");
      assertReceiptAccess(receipt, actor);

      const body = patchBodySchema.parse(await request.json());
      const updated = await updateReceiptCategory(receipt, body.category);
      return NextResponse.json(serializeReceipt(updated));
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
  { getActor: resolveActor },
);
