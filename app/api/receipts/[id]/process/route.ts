import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { apiError, mapErrorToResponse, rateLimitError } from "@/lib/api/errors";
import {
  checkActorProcessLimit,
  checkReceiptProcessCooldown,
} from "@/lib/api/rateLimit";
import { getActor } from "@/lib/auth/getActor";
import { prisma } from "@/lib/prisma";
import { assertReceiptAccess } from "@/lib/receipts/ownership";
import { assertPersistedReceiptId } from "@/lib/receipts/receiptId";
import { processReceiptTax } from "@/lib/receipts/processReceiptTax";
import {
  mimeForKind,
  assertValidReceiptImage,
} from "@/lib/receipts/uploadValidation";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { logEvent } from "@/lib/server/log/logEvent";
import { baseLogEntry } from "@/lib/server/log/context";
import { blobCommandOptions } from "@/lib/server/blob";
import { ocrDraftFromAiRaw } from "@/lib/ocr/ocrDraftSchema";
import { resolveVerifyContext } from "@/lib/verify/context";

export const maxDuration = 60;

export const POST = withRequestLog(
  "api.receipt",
  async (request, context) => {
    try {
      const actor = await getActor(request, { requireWrite: true });
      const { id } = await context.params;
      assertPersistedReceiptId(id);
      const receipt = await prisma.snaptaxReceipt.findUnique({ where: { id } });
      if (!receipt) throw new Error("NOT_FOUND");
      assertReceiptAccess(receipt, actor);

      if (receipt.status === "done" || receipt.status === "blurry") {
        return NextResponse.json({
          id: receipt.id,
          status: receipt.status,
          taxAmount: Number(receipt.taxAmount),
        });
      }

      const cooldown = await checkReceiptProcessCooldown(id);
      if (!cooldown.ok) {
        return rateLimitError(cooldown.retryAfterSec);
      }

      const actorLimit = await checkActorProcessLimit(actor);
      if (!actorLimit.ok) {
        return rateLimitError(actorLimit.retryAfterSec);
      }

      const blobResult = await get(receipt.imageUrl, {
        access: "private",
        ...blobCommandOptions(),
      });
      if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
        throw new Error("BLOB_FETCH_FAILED");
      }
      const bytes = Buffer.from(
        await new Response(blobResult.stream).arrayBuffer(),
      );
      const kind = assertValidReceiptImage(bytes);
      const mime = mimeForKind(kind);

      let industry: string | null = null;
      if (actor.kind === "user") {
        const user = await prisma.snaptaxUser.findUnique({
          where: { id: actor.userId },
          select: { industry: true },
        });
        industry = user?.industry ?? null;
      }

      const visionStart = Date.now();
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
      try {
        const ocrDraft = ocrDraftFromAiRaw(receipt.aiRaw);
        const result = await processReceiptTax({
          receiptId: id,
          dataRegion: receipt.dataRegion as "us" | "eu",
          imageBuffer: bytes,
          mime,
          industry,
          canMockAi: verify.canMockAi,
          ocrDraft,
          logContext: { request, actor },
        });

        logEvent({
          ...baseLogEntry("biz.openai", request, actor),
          level: result.status === "done" ? "info" : "error",
          success: result.status === "done",
          durationMs: Date.now() - visionStart,
          meta: {
            receiptId: id,
            status: result.status,
            dataRegion: receipt.dataRegion,
            ...(verify.canMockAi ? { reason: "verify_mock" } : {}),
          },
        });

        return NextResponse.json({
          id,
          status: result.status,
          taxAmount: result.taxAmount,
        });
      } catch {
        logEvent({
          ...baseLogEntry("biz.openai", request, actor),
          level: "warn",
          success: false,
          durationMs: Date.now() - visionStart,
          meta: { receiptId: id, status: "processing", reason: "process_failed" },
        });

        return NextResponse.json({
          id,
          status: "processing",
          taxAmount: 0,
          processFailed: true,
        });
      }
    } catch (err) {
      return mapErrorToResponse(err);
    }
  },
);
