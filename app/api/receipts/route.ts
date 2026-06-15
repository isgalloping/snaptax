import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { parseTaxRegionHeader } from "@/lib/api/taxRegion";
import {
  checkGhostReceiptLimit,
  checkIpReceiptLimit,
  checkUserReceiptLimit,
  clientIp,
} from "@/lib/api/rateLimit";
import { apiError, mapErrorToResponse, rateLimitError } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { prisma } from "@/lib/prisma";
import { processReceiptTax } from "@/lib/receipts/processReceiptTax";
import { receiptWhereForActor } from "@/lib/receipts/ownership";
import { serializeReceipt } from "@/lib/receipts/serialize";
import { unfiledReceiptWhere } from "@/lib/receipts/filedStatus";
import {
  assertValidReceiptImage,
  mimeForKind,
} from "@/lib/receipts/uploadValidation";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { blobCommandOptions } from "@/lib/server/blob";
import { parseUtcISOString, utcNow } from "@/lib/time/utc";
import { resolveVerifyContext } from "@/lib/verify/context";
import { logEvent } from "@/lib/server/log/logEvent";
import { baseLogEntry } from "@/lib/server/log/context";

export const maxDuration = 60;

async function resolveActor(req: NextRequest) {
  return getActor(req, { requireWrite: false });
}

export const GET = withRequestLog(
  "api.receipt",
  async (request, _context) => {
    try {
      const actor = await getActor(request);
      const limit = Math.min(
        100,
        Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 100)),
      );
      const where = receiptWhereForActor(actor);
      const receipts = await prisma.snaptaxReceipt.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
      });
      const agg = await prisma.snaptaxReceipt.aggregate({
        where: { ...where, status: "done", ...unfiledReceiptWhere() },
        _sum: { taxAmount: true },
      });
      return NextResponse.json({
        receipts: receipts.map(serializeReceipt),
        taxSavedEstimate: Number(agg._sum.taxAmount ?? 0),
      });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
  { getActor: resolveActor },
);

export const POST = withRequestLog(
  "api.receipt",
  async (request, _context) => {
    try {
      const actor = await getActor(request, { requireWrite: true });
      const ip = clientIp(request);
      const ipLimit = await checkIpReceiptLimit(ip);
      if (!ipLimit.ok) {
        return rateLimitError(ipLimit.retryAfterSec);
      }
      if (actor.kind === "ghost") {
        const ghostLimit = await checkGhostReceiptLimit(actor.ghostId);
        if (!ghostLimit.ok) {
          return rateLimitError(ghostLimit.retryAfterSec);
        }
        const maxUnbound = Number(process.env.RECEIPT_GHOST_MAX_UNBOUND ?? 50);
        const count = await prisma.snaptaxReceipt.count({
          where: { ghostId: actor.ghostId, userId: null },
        });
        if (count >= maxUnbound) {
          throw new Error("GHOST_RECEIPT_LIMIT");
        }
      } else {
        const userLimit = await checkUserReceiptLimit(actor.userId);
        if (!userLimit.ok) {
          return rateLimitError(userLimit.retryAfterSec);
        }
      }

      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return apiError("INVALID_FILE_TYPE", "Missing file", 400);
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      const kind = assertValidReceiptImage(bytes);
      const mime = mimeForKind(kind);
      const dataRegion = parseTaxRegionHeader(request);
      const receiptId = randomUUID();
      const pathname = `receipts/${receiptId}.${kind === "jpeg" ? "jpg" : "png"}`;

      const snapAtRaw = form.get("snapAt");
      const snapAt =
        typeof snapAtRaw === "string" && snapAtRaw
          ? parseUtcISOString(snapAtRaw)
          : null;

      let industry: string | null = null;
      if (actor.kind === "user") {
        const user = await prisma.snaptaxUser.findUnique({
          where: { id: actor.userId },
          select: { industry: true },
        });
        industry = user?.industry ?? null;
      }

      await put(pathname, bytes, {
        access: "private",
        contentType: mime,
        ...blobCommandOptions(),
      });

      await prisma.snaptaxReceipt.create({
        data: {
          id: receiptId,
          userId: actor.kind === "user" ? actor.userId : null,
          ghostId:
            actor.kind === "ghost"
              ? actor.ghostId
              : (actor.ghostId ?? null),
          imageUrl: pathname,
          status: "processing",
          dataRegion,
          taxAmount: 0,
          capturedAt: utcNow(),
          snapAt,
        },
      });

      try {
        const verify = await resolveVerifyContext(actor);
        if (verify.canBypass) {
          logEvent({
            ...baseLogEntry("biz.verify", request, actor),
            level: "info",
            success: true,
            durationMs: 0,
            meta: {
              verifyBypass: true,
              mockAi: verify.canMockAi,
              bypassPay: verify.canBypassPay,
            },
          });
        }

        const result = await processReceiptTax({
          receiptId,
          dataRegion,
          imageBuffer: bytes,
          mime,
          industry,
          canMockAi: verify.canMockAi,
        });

        return NextResponse.json(
          {
            id: receiptId,
            status: result.status,
            taxAmount: result.taxAmount,
            dataRegion,
          },
          { status: 201 },
        );
      } catch {
        return NextResponse.json(
          {
            id: receiptId,
            status: "processing",
            taxAmount: 0,
            dataRegion,
            processFailed: true,
          },
          { status: 201 },
        );
      }
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
  { getActor: resolveActor },
);
