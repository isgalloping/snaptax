import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { GHOST_COOKIE_NAME } from "@/lib/auth/ghostToken";
import { deleteGhostReceipts } from "@/lib/receipts/accountCleanup";
import { parseDeleteAccountOrphanGhostIds } from "@/lib/receipts/deleteAccountBody";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

export const DELETE = withRequestLog("api.user", async (request) => {
  try {
    const actor = await getActor(request);
    if (actor.kind !== "ghost") throw new Error("UNAUTHORIZED");
    if (actor.bound) throw new Error("GOOGLE_LOGIN_REQUIRED");

    await parseDeleteAccountOrphanGhostIds(request);
    await deleteGhostReceipts(actor.ghostId);

    const res = new NextResponse(null, { status: 204 });
    res.cookies.set(GHOST_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (err) {
    if (err instanceof SyntaxError || err instanceof ZodError) {
      return mapErrorToResponse(new Error("INVALID_REQUEST"));
    }
    return mapErrorToResponse(err);
  }
});
