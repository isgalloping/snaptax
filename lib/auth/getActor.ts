import { prisma } from "@/lib/prisma";
import {
  readGhostTokenFromCookie,
  verifyGhostToken,
  GHOST_COOKIE_NAME,
} from "@/lib/auth/ghostToken";
import { getSessionFromCookies } from "@/lib/auth/session";

export type Actor =
  | { kind: "user"; userId: string; ghostId?: string; email?: string }
  | { kind: "ghost"; ghostId: string; bound: boolean };

export type GetActorOptions = {
  requireWrite?: boolean;
};

export async function getActor(
  request: Request,
  options: GetActorOptions = {},
): Promise<Actor> {
  const session = await getSessionFromCookies();
  const ghostHeader = request.headers.get("x-ghost-id");
  const cookieHeader = request.headers.get("cookie");
  const ghostCookie = readGhostTokenFromCookie(cookieHeader);
  const authGhost = request.headers.get("authorization")?.match(/^Ghost\s+(.+)$/i)?.[1];

  let ghostId: string | undefined;
  if (ghostCookie) {
    try {
      ghostId = verifyGhostToken(ghostCookie).ghostId;
    } catch {
      throw new Error("UNAUTHORIZED");
    }
  } else if (authGhost) {
    try {
      ghostId = verifyGhostToken(authGhost).ghostId;
    } catch {
      throw new Error("UNAUTHORIZED");
    }
  }

  if (ghostHeader && ghostId && ghostHeader !== ghostId) {
    throw new Error("UNAUTHORIZED");
  }

  if (session) {
    return {
      kind: "user",
      userId: session.userId,
      ghostId,
      email: session.email,
    };
  }

  if (!ghostId) {
    throw new Error("UNAUTHORIZED");
  }

  const binding = await prisma.snaptaxGhostAccount.findUnique({
    where: { ghostId },
  });

  if (binding && options.requireWrite) {
    throw new Error("GOOGLE_LOGIN_REQUIRED");
  }

  return { kind: "ghost", ghostId, bound: Boolean(binding) };
}

export { GHOST_COOKIE_NAME };
