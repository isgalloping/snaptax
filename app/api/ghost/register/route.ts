import { NextResponse } from "next/server";
import {
  GHOST_COOKIE_NAME,
  signGhostToken,
} from "@/lib/auth/ghostToken";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

export const POST = withRequestLog("api.auth", async (_request, _context) => {
  const { token, ghostId } = signGhostToken();
  const res = NextResponse.json({ ghostId }, { status: 201 });
  res.cookies.set(GHOST_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
  });
  return res;
});
