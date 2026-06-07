import { NextResponse } from "next/server";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import { GHOST_COOKIE_NAME } from "@/lib/auth/ghostToken";
import { deleteGhostReceipts } from "@/lib/receipts/accountCleanup";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

export const DELETE = withRequestLog("api.user", async (request, _context) => {
  try {
    const actor = await getActor(request);
    if (actor.kind !== "ghost") throw new Error("UNAUTHORIZED");

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
    return mapErrorToResponse(err);
  }
});
