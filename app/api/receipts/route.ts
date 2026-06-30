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
import { receiptWhereForActor } from "@/lib/receipts/ownership";
import { serializeReceipt } from "@/lib/receipts/serialize";
import { unfiledReceiptWhere } from "@/lib/receipts/filedStatus";
import { parseClientReceiptId } from "@/lib/receipts/receiptId";
import { handleReceiptUploadPost } from "@/lib/receipts/receiptUploadService";
import {
  assertValidReceiptImage,
} from "@/lib/receipts/uploadValidation";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { parseCaptureKindHeader } from "@/lib/export/incomeCapture";
import { parseOcrDraftJson } from "@/lib/ocr/ocrDraftSchema";
import { parseUtcISOString } from "@/lib/time/utc";

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

      let clientReceiptId: string;
      try {
        clientReceiptId = parseClientReceiptId(form.get("clientReceiptId"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "INVALID_CLIENT_RECEIPT_ID";
        return mapErrorToResponse(new Error(message));
      }

      const existing = await prisma.snaptaxReceipt.findUnique({
        where: { id: clientReceiptId },
      });
      if (!existing) {
        if (actor.kind === "ghost") {
          const maxUnbound = Number(process.env.RECEIPT_GHOST_MAX_UNBOUND ?? 50);
          const count = await prisma.snaptaxReceipt.count({
            where: { ghostId: actor.ghostId, userId: null },
          });
          if (count >= maxUnbound) {
            throw new Error("GHOST_RECEIPT_LIMIT");
          }
        }
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      const kind = assertValidReceiptImage(bytes);
      const dataRegion = parseTaxRegionHeader(request);

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

      const ocrDraftRaw = form.get("ocrDraft");
      const ocrDraft =
        typeof ocrDraftRaw === "string" && ocrDraftRaw
          ? parseOcrDraftJson(ocrDraftRaw)
          : null;

      return await handleReceiptUploadPost({
        request,
        actor,
        clientReceiptId,
        bytes,
        kind,
        dataRegion,
        snapAt,
        industry,
        captureKind: parseCaptureKindHeader(
          request.headers.get("X-Capture-Kind"),
        ),
        ocrDraft,
      });
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
  { getActor: resolveActor },
);
