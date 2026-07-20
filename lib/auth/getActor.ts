import { prisma } from "@/lib/prisma";
import {
  readGhostTokenFromCookie,
  verifyGhostToken,
  GHOST_COOKIE_NAME,
} from "@/lib/auth/ghostToken";
import {
  getSessionFromCookies,
  type SessionPayload,
} from "@/lib/auth/session";

export type Actor =
  | { kind: "user"; userId: string; ghostId?: string; email?: string }
  | { kind: "ghost"; ghostId: string; bound: boolean };

export type GetActorOptions = {
  requireWrite?: boolean;
};

export type GetActorDeps = {
  getSession?: () => Promise<SessionPayload | null>;
  /** Return user id if the row exists; null if session is orphaned. */
  findUserId?: (userId: string) => Promise<string | null>;
  findGhostBinding?: (
    ghostId: string,
  ) => Promise<{ userId: string } | null>;
};

/**
 * Resolve request actor.
 * Aligns with GET /api/auth/me:
 * - invalid/expired ghost cookie → treat as absent (do not 401)
 * - session JWT whose user row is gone → fall through to ghost
 */
export async function getActor(
  request: Request,
  options: GetActorOptions = {},
  deps: GetActorDeps = {},
): Promise<Actor> {
  const getSession = deps.getSession ?? getSessionFromCookies;
  const findUserId =
    deps.findUserId ??
    (async (userId: string) => {
      const user = await prisma.snaptaxUser.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      return user?.id ?? null;
    });
  const findGhostBinding =
    deps.findGhostBinding ??
    (async (ghostId: string) =>
      prisma.snaptaxGhostAccount.findUnique({
        where: { ghostId },
        select: { userId: true },
      }));

  const session = await getSession();
  const ghostHeader = request.headers.get("x-ghost-id");
  const cookieHeader = request.headers.get("cookie");
  const ghostCookie = readGhostTokenFromCookie(cookieHeader);
  const authGhost = request.headers
    .get("authorization")
    ?.match(/^Ghost\s+(.+)$/i)?.[1];

  let ghostId: string | undefined;
  if (ghostCookie) {
    try {
      ghostId = verifyGhostToken(ghostCookie).ghostId;
    } catch {
      // Match /api/auth/me — soft-fail so orphan session + ensureGhost can recover.
      ghostId = undefined;
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
    const userId = await findUserId(session.userId);
    if (userId) {
      return {
        kind: "user",
        userId,
        ghostId,
        email: session.email,
      };
    }
  }

  if (!ghostId) {
    throw new Error("UNAUTHORIZED");
  }

  const binding = await findGhostBinding(ghostId);

  if (binding && options.requireWrite) {
    throw new Error("GOOGLE_LOGIN_REQUIRED");
  }

  return { kind: "ghost", ghostId, bound: Boolean(binding) };
}

export { GHOST_COOKIE_NAME };
