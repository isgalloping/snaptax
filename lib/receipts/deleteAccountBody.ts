import { z } from "zod";

export const deleteAccountBodySchema = z.object({
  orphanGhostIds: z.array(z.string().min(1)).max(20).default([]),
});

/**
 * Parse optional DELETE JSON body; empty body → [].
 * Client orphan ids are compatibility-only and are not used as delete authority.
 */
export async function parseDeleteAccountOrphanGhostIds(
  request: Request,
): Promise<string[]> {
  const text = await request.text();
  if (!text.trim()) return [];
  const json: unknown = JSON.parse(text);
  return deleteAccountBodySchema.parse(json).orphanGhostIds;
}
