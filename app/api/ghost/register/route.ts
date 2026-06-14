import { NextRequest, NextResponse } from "next/server";
import { rateLimitError } from "@/lib/api/errors";
import { checkGhostRegisterLimit, clientIp } from "@/lib/api/rateLimit";
import {
  GHOST_COOKIE_NAME,
  readGhostTokenFromCookie,
  signGhostToken,
  verifyGhostToken,
} from "@/lib/auth/ghostToken";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

const ghostCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 90 * 24 * 60 * 60,
};

export const POST = withRequestLog("api.auth", async (request: NextRequest, _context) => {
  const ip = clientIp(request);
  const registerLimit = await checkGhostRegisterLimit(ip);
  if (!registerLimit.ok) {
    return rateLimitError(registerLimit.retryAfterSec);
  }

  const existingToken = readGhostTokenFromCookie(request.headers.get("cookie"));
  if (existingToken) {
    try {
      const { ghostId } = verifyGhostToken(existingToken);
      return NextResponse.json({ ghostId, reused: true }, { status: 200 });
    } catch {
      // Expired or tampered — mint a new token below.
    }
  }

  const { token, ghostId } = signGhostToken();
  const res = NextResponse.json({ ghostId, reused: false }, { status: 201 });
  res.cookies.set(GHOST_COOKIE_NAME, token, ghostCookieOptions);
  return res;
});
