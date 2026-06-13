import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getActor } from "@/lib/auth/getActor";
import { mapErrorToResponse } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { assertReceiptAccess } from "@/lib/receipts/ownership";
import { processReceiptTax } from "@/lib/receipts/processReceiptTax";
import {
  mimeForKind,
  assertValidReceiptImage,
} from "@/lib/receipts/uploadValidation";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { logEvent } from "@/lib/server/log/logEvent";
import { baseLogEntry } from "@/lib/server/log/context";
import { blobCommandOptions } from "@/lib/server/blob";
import { resolveVerifyContext } from "@/lib/verify/context";

export const maxDuration = 60;

export const POST = withRequestLog(
  "api.receipt",
  async (request, context) => {
    try {
      const actor = await getActor(request, { requireWrite: true });
      const { id } = await context.params;
      const receipt = await prisma.snaptaxReceipt.findUnique({ where: { id } });
      if (!receipt) throw new Error("NOT_FOUND");
      assertReceiptAccess(receipt, actor);

      if (receipt.status === "done") {
        return NextResponse.json({
          id: receipt.id,
          status: receipt.status,
          taxAmount: Number(receipt.taxAmount),
        });
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
        const result = await processReceiptTax({
          receiptId: id,
          dataRegion: receipt.dataRegion as "us" | "eu",
          imageBuffer: bytes,
          mime,
          industry,
          canMockAi: verify.canMockAi,
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
