import { put } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { SnaptaxReceipt } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { Actor } from "@/lib/auth/getActor";
import { prisma } from "@/lib/prisma";
import { assertReceiptAccess, receiptWhereForActor } from "@/lib/receipts/ownership";
import { processReceiptTax } from "@/lib/receipts/processReceiptTax";
import { serializeReceipt } from "@/lib/receipts/serialize";
import { unfiledReceiptWhere } from "@/lib/receipts/filedStatus";
import { mimeForKind } from "@/lib/receipts/uploadValidation";
import {
  computeImageFingerprint,
  contentSha256,
  findSimilarFingerprintMatch,
  receiptImagePathname,
} from "@/lib/receipts/imageFingerprint";
import { blobCommandOptions } from "@/lib/server/blob";
import { utcNow } from "@/lib/time/utc";
import { resolveVerifyContext } from "@/lib/verify/context";
import { logEvent } from "@/lib/server/log/logEvent";
import { baseLogEntry } from "@/lib/server/log/context";

export type DuplicateMatchType = "exact" | "similar";

function duplicateResponse(
  existingReceiptId: string,
  matchType: DuplicateMatchType,
) {
  return NextResponse.json(
    {
      error: { code: "DUPLICATE_RECEIPT", message: "This receipt is already in your list" },
      existingReceiptId,
      matchType,
    },
    { status: 409 },
  );
}

async function findExactDuplicate(
  actor: Actor,
  sha: string,
  excludeId: string,
): Promise<SnaptaxReceipt | null> {
  return prisma.snaptaxReceipt.findFirst({
    where: {
      ...receiptWhereForActor(actor),
      ...unfiledReceiptWhere(),
      contentSha256: sha,
      NOT: { id: excludeId },
    },
  });
}

async function findSimilarDuplicate(
  actor: Actor,
  fingerprint: string,
  excludeId: string,
): Promise<SnaptaxReceipt | null> {
  const candidates = await prisma.snaptaxReceipt.findMany({
    where: {
      ...receiptWhereForActor(actor),
      ...unfiledReceiptWhere(),
      NOT: { id: excludeId },
    },
    select: { id: true, imageFingerprint: true },
  });
  const match = findSimilarFingerprintMatch(candidates, fingerprint, excludeId);
  if (!match) return null;
  return prisma.snaptaxReceipt.findUnique({ where: { id: match.id } });
}

async function logVerifyBypass(request: NextRequest, actor: Actor) {
  const verify = await resolveVerifyContext(actor);
  if (!verify.canBypass) return verify;
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
  return verify;
}

async function runVisionForReceipt(params: {
  request: NextRequest;
  actor: Actor;
  receiptId: string;
  dataRegion: "us" | "eu";
  bytes: Buffer;
  mime: "image/jpeg" | "image/png";
  industry: string | null;
}) {
  const verify = await logVerifyBypass(params.request, params.actor);
  try {
    const result = await processReceiptTax({
      receiptId: params.receiptId,
      dataRegion: params.dataRegion,
      imageBuffer: params.bytes,
      mime: params.mime,
      industry: params.industry,
      canMockAi: verify.canMockAi,
    });
    return { processFailed: false as const, result };
  } catch {
    return { processFailed: true as const, result: null };
  }
}

function uploadJsonResponse(
  receipt: SnaptaxReceipt,
  status: 200 | 201,
  processFailed?: boolean,
) {
  if (processFailed) {
    return NextResponse.json(
      {
        id: receipt.id,
        status: "processing",
        taxAmount: 0,
        dataRegion: receipt.dataRegion,
        processFailed: true,
      },
      { status },
    );
  }
  return NextResponse.json(serializeReceipt(receipt), { status });
}

async function replaceReceiptImage(params: {
  request: NextRequest;
  actor: Actor;
  receipt: SnaptaxReceipt;
  bytes: Buffer;
  kind: "jpeg" | "png";
  mime: "image/jpeg" | "image/png";
  dataRegion: "us" | "eu";
  snapAt: Date | null;
  industry: string | null;
  sha: string;
  fingerprint: string;
}) {
  const pathname = receiptImagePathname(params.receipt.id, params.kind);
  await put(pathname, params.bytes, {
    access: "private",
    contentType: params.mime,
    ...blobCommandOptions(),
  });

  await prisma.snaptaxReceipt.update({
    where: { id: params.receipt.id },
    data: {
      imageUrl: pathname,
      contentSha256: params.sha,
      imageFingerprint: params.fingerprint,
      status: "processing",
      amount: null,
      currency: null,
      merchantName: null,
      category: null,
      deductible: true,
      taxAmount: 0,
      dataRegion: params.dataRegion,
      aiRaw: Prisma.DbNull,
      processedAt: null,
      snapAt: params.snapAt ?? params.receipt.snapAt,
      capturedAt: utcNow(),
    },
  });

  const vision = await runVisionForReceipt({
    request: params.request,
    actor: params.actor,
    receiptId: params.receipt.id,
    dataRegion: params.dataRegion,
    bytes: params.bytes,
    mime: params.mime,
    industry: params.industry,
  });

  const updated = await prisma.snaptaxReceipt.findUnique({
    where: { id: params.receipt.id },
  });
  if (!updated) throw new Error("NOT_FOUND");
  return uploadJsonResponse(updated, 200, vision.processFailed);
}

export async function handleReceiptUploadPost(params: {
  request: NextRequest;
  actor: Actor;
  clientReceiptId: string;
  bytes: Buffer;
  kind: "jpeg" | "png";
  dataRegion: "us" | "eu";
  snapAt: Date | null;
  industry: string | null;
}) {
  const mime = mimeForKind(params.kind);
  const sha = contentSha256(params.bytes);
  const fingerprint = await computeImageFingerprint(params.bytes);

  const existing = await prisma.snaptaxReceipt.findUnique({
    where: { id: params.clientReceiptId },
  });

  if (existing) {
    try {
      assertReceiptAccess(existing, params.actor);
    } catch {
      throw new Error("NOT_FOUND");
    }

    if (existing.contentSha256 === sha) {
      return uploadJsonResponse(existing, 200);
    }

    return replaceReceiptImage({
      request: params.request,
      actor: params.actor,
      receipt: existing,
      bytes: params.bytes,
      kind: params.kind,
      mime,
      dataRegion: params.dataRegion,
      snapAt: params.snapAt,
      industry: params.industry,
      sha,
      fingerprint,
    });
  }

  const exactDup = await findExactDuplicate(params.actor, sha, params.clientReceiptId);
  if (exactDup) {
    return duplicateResponse(exactDup.id, "exact");
  }

  const similarDup = await findSimilarDuplicate(
    params.actor,
    fingerprint,
    params.clientReceiptId,
  );
  if (similarDup) {
    return duplicateResponse(similarDup.id, "similar");
  }

  const pathname = receiptImagePathname(params.clientReceiptId, params.kind);
  await put(pathname, params.bytes, {
    access: "private",
    contentType: mime,
    ...blobCommandOptions(),
  });

  try {
    await prisma.snaptaxReceipt.create({
      data: {
        id: params.clientReceiptId,
        userId: params.actor.kind === "user" ? params.actor.userId : null,
        ghostId:
          params.actor.kind === "ghost"
            ? params.actor.ghostId
            : (params.actor.ghostId ?? null),
        imageUrl: pathname,
        status: "processing",
        dataRegion: params.dataRegion,
        taxAmount: 0,
        capturedAt: utcNow(),
        snapAt: params.snapAt,
        contentSha256: sha,
        imageFingerprint: fingerprint,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const dup =
        (await findExactDuplicate(params.actor, sha, params.clientReceiptId)) ??
        (await prisma.snaptaxReceipt.findUnique({
          where: { id: params.clientReceiptId },
        }));
      if (dup) {
        try {
          assertReceiptAccess(dup, params.actor);
        } catch {
          throw new Error("NOT_FOUND");
        }
        return uploadJsonResponse(dup, 200);
      }
      throw new Error("DUPLICATE_RECEIPT");
    }
    throw err;
  }

  const vision = await runVisionForReceipt({
    request: params.request,
    actor: params.actor,
    receiptId: params.clientReceiptId,
    dataRegion: params.dataRegion,
    bytes: params.bytes,
    mime,
    industry: params.industry,
  });

  const created = await prisma.snaptaxReceipt.findUnique({
    where: { id: params.clientReceiptId },
  });
  if (!created) throw new Error("NOT_FOUND");
  return uploadJsonResponse(created, 201, vision.processFailed);
}
