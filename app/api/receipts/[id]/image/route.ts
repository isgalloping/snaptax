import { issueSignedToken, presignUrl } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getActor } from "@/lib/auth/getActor";
import { mapErrorToResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { assertReceiptAccess } from "@/lib/receipts/ownership";
import { assertPersistedReceiptId } from "@/lib/receipts/receiptId";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { blobCommandOptions } from "@/lib/server/blob";

const SIGNED_URL_TTL_MS = 15 * 60 * 1000;

async function resolveActor(req: Request) {
  return getActor(req);
}

export const GET = withRequestLog(
  "api.receipt",
  async (request, context) => {
    try {
      const { id } = await context.params;
      assertPersistedReceiptId(id);
      const actor = await getActor(request);
      const receipt = await prisma.snaptaxReceipt.findUnique({ where: { id } });
      if (!receipt) throw new Error("NOT_FOUND");
      assertReceiptAccess(receipt, actor);

      const pathname = receipt.imageUrl?.trim();
      if (!pathname) throw new Error("NOT_FOUND");

      const validUntil = Date.now() + SIGNED_URL_TTL_MS;
      const blobOpts = blobCommandOptions();
      const signedToken = await issueSignedToken({
        ...blobOpts,
        pathname,
        operations: ["get"],
        validUntil,
      });
      const { presignedUrl } = await presignUrl(signedToken, {
        operation: "get",
        pathname,
        access: "private",
        validUntil,
      });

      return NextResponse.json({
        url: presignedUrl,
        expiresAt: new Date(validUntil).toISOString(),
      });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
  { getActor: resolveActor },
);
