import { NextRequest, NextResponse } from "next/server";
import {
  parseTaxRegionHeader,
  resolveInitialDataRegion,
} from "@/lib/api/taxRegion";
import { mapErrorToResponse } from "@/lib/api/errors";
import { verifyGoogleIdToken } from "@/lib/auth/googleVerify";
import {
  readGhostTokenFromCookie,
  verifyGhostToken,
} from "@/lib/auth/ghostToken";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  enqueueTaxRecalc,
  resolveGhostCandidate,
} from "@/lib/receipts/taxRecalcQueue";
import { logEvent } from "@/lib/server/log/logEvent";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { shouldRecalcOnLogin } from "@/lib/tax/shouldRecalcOnLogin";
import type { TaxRegion } from "@/lib/tax/types";
import { utcNow } from "@/lib/time/utc";

export const POST = withRequestLog("api.auth", async (request, _context) => {
  try {
    const body = (await request.json()) as { credential?: string };
    if (!body.credential) throw new Error("INVALID_GOOGLE_TOKEN");

    const cookieHeader = request.headers.get("cookie");
    const ghostToken = readGhostTokenFromCookie(cookieHeader);
    if (!ghostToken) throw new Error("UNAUTHORIZED");
    const { ghostId } = verifyGhostToken(ghostToken);

    const profile = await verifyGoogleIdToken(body.credential);

    const existingBinding = await prisma.snaptaxGhostAccount.findUnique({
      where: { ghostId },
      include: { user: true },
    });

    let user = await prisma.snaptaxUser.findUnique({
      where: {
        authChannel_userId: {
          authChannel: "google",
          userId: profile.sub,
        },
      },
    });

    if (!user) {
      const headerRegion = parseTaxRegionHeader(request) as TaxRegion;
      const resolved = resolveInitialDataRegion({
        headerRegion,
        acceptLanguage: request.headers.get("accept-language"),
      });

      if (resolved.adjusted) {
        logEvent({
          ts: new Date().toISOString(),
          level: "warn",
          module: "api.auth",
          success: true,
          durationMs: 0,
          meta: {
            reason: resolved.reason ?? "region_adjusted",
            headerRegion,
            dataRegion: resolved.region,
          },
        });
      }

      user = await prisma.snaptaxUser.create({
        data: {
          userId: profile.sub,
          userEmail: profile.email,
          userName: profile.name ?? null,
          authChannel: "google",
          dataRegion: resolved.region,
          dataRegionLockedAt: utcNow(),
        },
      });
    }

    const lockedRegion = user.dataRegion as TaxRegion;
    const ghostCandidate = await resolveGhostCandidate(ghostId, lockedRegion);

    if (existingBinding && existingBinding.userId !== user.id) {
      throw new Error("GHOST_ALREADY_BOUND");
    }

    if (!existingBinding) {
      await prisma.snaptaxGhostAccount.create({
        data: { ghostId, userId: user.id },
      });
    }

    await prisma.snaptaxReceipt.updateMany({
      where: { ghostId, userId: null },
      data: { userId: user.id },
    });

    let taxRecalcQueued = 0;
    if (shouldRecalcOnLogin(lockedRegion, ghostCandidate)) {
      taxRecalcQueued = await enqueueTaxRecalc({
        userId: user.id,
        lockedRegion,
        industry: user.industry,
      });
    }

    const sessionToken = await signSessionToken({
      userId: user.id,
      email: user.userEmail,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.userEmail,
        name: user.userName,
        dataRegion: user.dataRegion,
        industry: user.industry,
      },
      bound: true,
      taxRecalcQueued,
    });

    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_GOOGLE_TOKEN") {
      return mapErrorToResponse(new Error("UNAUTHORIZED"));
    }
    if (err instanceof Error && err.message === "GHOST_ALREADY_BOUND") {
      return NextResponse.json(
        { error: { code: "GHOST_ALREADY_BOUND", message: "Ghost already linked" } },
        { status: 409 },
      );
    }
    return mapErrorToResponse(err);
  }
});
