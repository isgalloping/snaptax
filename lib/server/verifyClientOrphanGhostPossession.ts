import { verifyGhostToken } from "@/lib/auth/ghostToken";

export type ClientOrphanGhostPossession = {
  ghostId: string;
  token: string;
};

/**
 * Accept only orphan ghost IDs whose HMAC token verifies and matches ghostId.
 * Invalid / mismatched / expired tokens are ignored (no merge privilege).
 */
export function verifyClientOrphanGhostPossession(
  orphans: ClientOrphanGhostPossession[],
): string[] {
  const verified = new Set<string>();
  for (const orphan of orphans) {
    if (!orphan.ghostId || !orphan.token) continue;
    try {
      const { ghostId } = verifyGhostToken(orphan.token);
      if (ghostId === orphan.ghostId) {
        verified.add(ghostId);
      }
    } catch {
      /* invalid token — skip */
    }
  }
  return [...verified];
}
