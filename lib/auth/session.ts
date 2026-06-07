import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { getAuthSecret } from "@/lib/server/env";

export const SESSION_COOKIE_NAME = "snap1099_session";
const SESSION_TTL = "30d";

export type SessionPayload = {
  userId: string;
  email?: string;
};

function authSecret(): Uint8Array {
  const s = getAuthSecret();
  if (!s) throw new Error("AUTH_SECRET missing");
  return new TextEncoder().encode(s);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(authSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, authSecret());
    const userId = payload.sub;
    if (!userId || typeof userId !== "string") return null;
    return {
      userId,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
