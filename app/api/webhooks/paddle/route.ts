import { NextResponse } from "next/server";
import { verifyPaddleWebhookSignature } from "@/lib/server/paddleWebhook";
import {
  handlePaddleWebhookPayload,
  type PaddleNotificationPayload,
} from "@/lib/billing/handlePaddleWebhook";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { logEvent } from "@/lib/server/log/logEvent";

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

  let payload: PaddleNotificationPayload;
  try {
    payload = JSON.parse(rawBody) as PaddleNotificationPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const result = await handlePaddleWebhookPayload(payload);
  return NextResponse.json(result);
});
