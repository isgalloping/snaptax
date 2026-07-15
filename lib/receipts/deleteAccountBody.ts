import { z } from "zod";
import { orphanGhostsBodyField } from "@/lib/server/orphanGhostPossessionSchema";
import { verifyClientOrphanGhostPossession } from "@/lib/server/verifyClientOrphanGhostPossession";
import type { ClientOrphanGhostPossession } from "@/lib/server/verifyClientOrphanGhostPossession";

export const deleteAccountBodySchema = z.object({
  orphanGhosts: orphanGhostsBodyField,
});

/** Parse DELETE body → HMAC-verified orphan ghost IDs only. Empty body → []. */
export async function parseDeleteAccountOrphanGhostIds(
  request: Request,
): Promise<string[]> {
  const text = await request.text();
  if (!text.trim()) return [];
  const json: unknown = JSON.parse(text);
  const body = deleteAccountBodySchema.parse(json);
  return verifyClientOrphanGhostPossession(
    body.orphanGhosts as ClientOrphanGhostPossession[],
  );
}
