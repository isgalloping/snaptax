import { discoverOrphanGhostIds } from "@/lib/server/discoverOrphanGhostIds";
import {
  listHistoricalGhostIdsForUser,
  mergeOrphanGhostData,
  type OrphanGhostMergeDb,
  type OrphanGhostMergeResult,
} from "@/lib/server/mergeOrphanGhostData";
import { prisma } from "@/lib/prisma";

export type RunOrphanGhostMergeInput = {
  userId: string;
  currentGhostId: string;
  rebindPreviousGhostId?: string | null;
};

export async function runOrphanGhostMergeForUser(
  input: RunOrphanGhostMergeInput,
  db: OrphanGhostMergeDb = prisma,
): Promise<OrphanGhostMergeResult> {
  const historicalGhostIds = await listHistoricalGhostIdsForUser(input.userId, db);
  const ghostIds = discoverOrphanGhostIds({
    currentGhostId: input.currentGhostId,
    rebindPreviousGhostId: input.rebindPreviousGhostId ?? null,
    historicalGhostIds,
  });

  if (ghostIds.length === 0) {
    return { merged: [], mergedGhostIds: [], totalReceipts: 0 };
  }

  return mergeOrphanGhostData(input.userId, ghostIds, db);
}
