import { NextResponse } from "next/server";
import { GHOST_COOKIE_NAME } from "@/lib/auth/ghostToken";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
};

export const POST = withRequestLog("api.auth", async () => {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", clearCookieOptions);
  res.cookies.set(GHOST_COOKIE_NAME, "", clearCookieOptions);
  return res;
});
