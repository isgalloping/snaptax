import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaddleWebhookSignature } from "@/lib/server/paddleWebhook";
import { currentTaxSeason } from "@/lib/tax/season";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { logEvent } from "@/lib/server/log/logEvent";
import { utcNow } from "@/lib/time/utc";

export const POST = withRequestLog("api.webhook", async (request, _context) => {
  const rawBody = await request.text();
  const signature =
    request.headers.get("paddle-signature") ??
    request.headers.get("Paddle-Signature");

  try {
    if (!verifyPaddleWebhookSignature(rawBody, signature)) {
      logEvent({
        ts: new Date().toISOString(),
        level: "warn",
        module: "biz.paddle",
        success: false,
        durationMs: 0,
        meta: { reason: "invalid_signature" },
      });
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "PADDLE_VERIFY_FAILED";
    logEvent({
      ts: new Date().toISOString(),
      level: "error",
      module: "biz.paddle",
      success: false,
      durationMs: 0,
      meta: { errorMessage: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let payload: {
    event_type?: string;
    data?: {
      id?: string;
      status?: string;
      custom_data?: { userId?: string; taxSeason?: string };
      details?: { totals?: { total?: string } };
    };
  };

  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (payload.event_type !== "transaction.completed") {
    return NextResponse.json({ ok: true });
  }

  const data = payload.data;
  const userId = data?.custom_data?.userId;
  const transactionId = data?.id;
  if (!userId || !transactionId) {
    return NextResponse.json({ ok: true });
  }

  const taxSeason = data.custom_data?.taxSeason ?? currentTaxSeason();
  const amount = Number(data.details?.totals?.total ?? 49);

  await prisma.snaptaxSeasonEntitlement.upsert({
    where: { transactionId },
    create: {
      userId,
      taxSeason,
      transactionId,
      paidAt: utcNow(),
      amount,
      channelCode: "paddle",
    },
    update: {
      paidAt: utcNow(),
      amount,
    },
  });

  logEvent({
    ts: new Date().toISOString(),
    level: "info",
    module: "biz.paddle",
    success: true,
    durationMs: 0,
    meta: {
      transactionId,
      taxSeason,
    },
  });

  return NextResponse.json({ ok: true });
});
