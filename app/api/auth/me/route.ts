import { NextResponse } from "next/server";
import {
  readGhostTokenFromCookie,
  verifyGhostToken,
} from "@/lib/auth/ghostToken";
import { getSessionFromCookies } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { withRequestLog } from "@/lib/server/log/withRequestLog";

export const GET = withRequestLog("api.auth", async (request, _context) => {
  const session = await getSessionFromCookies();
  const cookieHeader = request.headers.get("cookie");
  const ghostToken = readGhostTokenFromCookie(cookieHeader);
  let ghostId: string | null = null;
  if (ghostToken) {
    try {
      ghostId = verifyGhostToken(ghostToken).ghostId;
    } catch {
      ghostId = null;
    }
  }

  if (!session) {
    return NextResponse.json({ user: null, ghostId });
  }

  const user = await prisma.snaptaxUser.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      userEmail: true,
      userName: true,
      industry: true,
      dataRegion: true,
    },
  });

  if (!user) {
    return NextResponse.json({ user: null, ghostId });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.userEmail,
      name: user.userName,
      industry: user.industry,
      dataRegion: user.dataRegion,
    },
    ghostId,
  });
});
