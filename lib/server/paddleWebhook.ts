import { createHmac, timingSafeEqual } from "crypto";
import { getPaddleWebhookSecret } from "@/lib/server/env";
import { logEvent } from "@/lib/server/log/logEvent";

const MAX_AGE_SEC = 300;

function parsePaddleSignatureHeader(header: string): {
  ts: string | null;
  h1: string[];
} {
  const ts: string[] = [];
  const h1: string[] = [];
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "ts") ts.push(value);
    if (key === "h1") h1.push(value);
  }
  return { ts: ts[0] ?? null, h1 };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a, "utf8");
    const right = Buffer.from(b, "utf8");
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = getPaddleWebhookSecret();
  if (!secret) throw new Error("PADDLE_WEBHOOK_SECRET missing");

  const maySkipVerify =
    process.env.NODE_ENV === "development" &&
    process.env.PADDLE_WEBHOOK_SKIP_VERIFY === "1";

  if (maySkipVerify) {
    logEvent({
      ts: new Date().toISOString(),
      level: "warn",
      module: "biz.paddle",
      success: true,
      durationMs: 0,
      meta: {
        reason: "webhook_verify_skipped_dev_flag",
      },
    });
    return true;
  }

  if (!signatureHeader) return false;

  const { ts, h1 } = parsePaddleSignatureHeader(signatureHeader);
  if (!ts || h1.length === 0) return false;

  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;

  const ageSec = Math.abs(Date.now() / 1000 - tsNum);
  if (ageSec > MAX_AGE_SEC) return false;

  const expected = createHmac("sha256", secret)
    .update(`${ts}:${rawBody}`)
    .digest("hex");

  return h1.some((sig) => timingSafeEqualHex(sig, expected));
}
