import { createHmac, randomUUID, timingSafeEqual } from "crypto";

export const GHOST_COOKIE_NAME = "snap1099_ghost";
const TTL_MS = 90 * 24 * 60 * 60 * 1000;

import { getGhostHmacSecret } from "@/lib/server/env";

function secret(): string {
  const s = getGhostHmacSecret();
  if (!s) throw new Error("GHOST_HMAC_SECRET missing");
  return s;
}

export function signGhostToken(existingGhostId?: string) {
  const ghostId = existingGhostId ?? randomUUID();
  const exp = Date.now() + TTL_MS;
  const body = `${ghostId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  const token = `${body}.${sig}`;
  return { token, ghostId, cookieName: GHOST_COOKIE_NAME };
}

export function verifyGhostToken(token: string): { ghostId: string; exp: number } {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("INVALID_GHOST_TOKEN");
  const [ghostId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!ghostId || !Number.isFinite(exp) || Date.now() > exp) {
    throw new Error("INVALID_GHOST_TOKEN");
  }
  const body = `${ghostId}.${expStr}`;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("INVALID_GHOST_TOKEN");
  }
  return { ghostId, exp };
}

export function readGhostTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${GHOST_COOKIE_NAME}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(GHOST_COOKIE_NAME.length + 1));
}
