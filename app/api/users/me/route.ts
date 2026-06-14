import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { GHOST_COOKIE_NAME } from "@/lib/auth/ghostToken";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { deleteUserAccount } from "@/lib/receipts/accountCleanup";
import { getSessionFromCookies } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { patchUserBodySchema } from "@/lib/users/industrySchema";

export const DELETE = withRequestLog("api.user", async (request, _context) => {
  try {
    const session = await getSessionFromCookies();
    if (!session) throw new Error("UNAUTHORIZED");

    await deleteUserAccount(session.userId);

    const res = new NextResponse(null, { status: 204 });
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    res.cookies.set(GHOST_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (err) {
    return mapErrorToResponse(err);
  }
});

export const PATCH = withRequestLog("api.user", async (request, _context) => {
  try {
    const actor = await getActor(request, { requireWrite: false });
    if (actor.kind !== "user") throw new Error("UNAUTHORIZED");

    const raw = await request.json();
    const body = patchUserBodySchema.parse(raw);

    const user = await prisma.snaptaxUser.update({
      where: { id: actor.userId },
      data: { industry: body.industry },
      select: { id: true, industry: true },
    });

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof ZodError) {
      return mapErrorToResponse(new Error("INVALID_INDUSTRY"));
    }
    return mapErrorToResponse(err);
  }
});
