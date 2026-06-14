import { consumeRateLimit } from "@/lib/api/dbRateLimit";
import { clientIp } from "@/lib/api/clientIp";
import type { Actor } from "@/lib/auth/getActor";

export { clientIp };

type LimitResult = { ok: true } | { ok: false; retryAfterSec: number };

const MS_PER_MIN = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MIN;

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function checkIpReceiptLimit(ip: string): Promise<LimitResult> {
  const result = await consumeRateLimit({
    bucketKey: `ip:receipt:${ip}`,
    windowMs: MS_PER_MIN,
    limit: envInt("RECEIPT_IP_PER_MIN", 60),
  });
  if (result.ok) return { ok: true };
  return { ok: false, retryAfterSec: result.retryAfterSec };
}

export async function checkGhostReceiptLimit(
  ghostId: string,
): Promise<LimitResult> {
  const result = await consumeRateLimit({
    bucketKey: `ghost:receipt:${ghostId}`,
    windowMs: MS_PER_HOUR,
    limit: envInt("RECEIPT_GHOST_HOURLY", 10),
  });
  if (result.ok) return { ok: true };
  return { ok: false, retryAfterSec: result.retryAfterSec };
}

export async function checkUserReceiptLimit(
  userId: string,
): Promise<LimitResult> {
  const result = await consumeRateLimit({
    bucketKey: `user:receipt:${userId}`,
    windowMs: MS_PER_HOUR,
    limit: envInt("RECEIPT_USER_HOURLY", 30),
  });
  if (result.ok) return { ok: true };
  return { ok: false, retryAfterSec: result.retryAfterSec };
}

export async function checkGhostRegisterLimit(ip: string): Promise<LimitResult> {
  const result = await consumeRateLimit({
    bucketKey: `ip:ghost_register:${ip}`,
    windowMs: MS_PER_MIN,
    limit: envInt("GHOST_REGISTER_IP_PER_MIN", 10),
  });
  if (result.ok) return { ok: true };
  return { ok: false, retryAfterSec: result.retryAfterSec };
}

export async function checkReceiptProcessCooldown(
  receiptId: string,
): Promise<LimitResult> {
  const result = await consumeRateLimit({
    bucketKey: `process:receipt:${receiptId}`,
    windowMs: envInt("RECEIPT_PROCESS_COOLDOWN_MS", 30_000),
    limit: 1,
  });
  if (result.ok) return { ok: true };
  return { ok: false, retryAfterSec: result.retryAfterSec };
}

export async function checkActorProcessLimit(actor: Actor): Promise<LimitResult> {
  const bucketKey =
    actor.kind === "user"
      ? `user:process:${actor.userId}`
      : `ghost:process:${actor.ghostId}`;
  const result = await consumeRateLimit({
    bucketKey,
    windowMs: MS_PER_HOUR,
    limit: envInt("RECEIPT_PROCESS_HOURLY", 20),
  });
  if (result.ok) return { ok: true };
  return { ok: false, retryAfterSec: result.retryAfterSec };
}
