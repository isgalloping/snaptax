import { NextResponse } from "next/server";
import { z } from "zod";
import { mapErrorToResponse } from "@/lib/api/errors";
import { getActor } from "@/lib/auth/getActor";
import {
  readGhostTokenFromCookie,
  verifyGhostToken,
} from "@/lib/auth/ghostToken";
import { orphanGhostsBodyField } from "@/lib/server/orphanGhostPossessionSchema";
import { logEvent } from "@/lib/server/log/logEvent";
import { withRequestLog } from "@/lib/server/log/withRequestLog";
import { runOrphanGhostMergeForUser } from "@/lib/server/runOrphanGhostMergeForUser";
import { verifyClientOrphanGhostPossession } from "@/lib/server/verifyClientOrphanGhostPossession";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  orphanGhosts: orphanGhostsBodyField,
});

export const POST = withRequestLog("api.sync", async (request, _context) => {
  try {
    const actor = await getActor(request, { requireWrite: true });
    if (actor.kind !== "user") {
      throw new Error("GOOGLE_LOGIN_REQUIRED");
    }

    let currentGhostId = actor.ghostId;
    if (!currentGhostId) {
      const ghostToken = readGhostTokenFromCookie(request.headers.get("cookie"));
      if (ghostToken) {
        currentGhostId = verifyGhostToken(ghostToken).ghostId;
      }
    }
    if (!currentGhostId) {
      throw new Error("UNAUTHORIZED");
    }

    const body = bodySchema.parse(await request.json());
    const verifiedClientOrphanGhostIds = verifyClientOrphanGhostPossession(
      body.orphanGhosts,
    );

    const result = await prisma.$transaction((tx) =>
      runOrphanGhostMergeForUser(
        {
          userId: actor.userId,
          currentGhostId,
          verifiedClientOrphanGhostIds,
        },
        tx,
      ),
    );

    if (result.totalReceipts > 0 || result.mergedGhostIds.length > 0) {
      logEvent({
        ts: new Date().toISOString(),
        level: "info",
        module: "api.sync",
        success: true,
        durationMs: 0,
        userId: actor.userId,
        ghostId: currentGhostId,
        meta: {
          reason: `orphan_ghost_merge ghosts=${result.mergedGhostIds.length} receipts=${result.totalReceipts}`,
          mergedGhostIds: result.mergedGhostIds,
        },
      });
    }

    return NextResponse.json({
      mergedGhostIds: result.mergedGhostIds,
      totalReceipts: result.totalReceipts,
    });
  } catch (err) {
    return mapErrorToResponse(err);
  }
});
