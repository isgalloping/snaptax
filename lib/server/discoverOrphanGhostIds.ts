export function discoverOrphanGhostIds(input: {
  currentGhostId: string;
  rebindPreviousGhostId: string | null;
  historicalGhostIds: string[];
  /** Only IDs already verified via HMAC ghost token possession. */
  verifiedClientOrphanGhostIds?: string[];
}): string[] {
  const candidates = new Set<string>();

  if (input.rebindPreviousGhostId) {
    candidates.add(input.rebindPreviousGhostId);
  }
  for (const ghostId of input.historicalGhostIds) {
    if (ghostId) candidates.add(ghostId);
  }
  for (const ghostId of input.verifiedClientOrphanGhostIds ?? []) {
    if (ghostId) candidates.add(ghostId);
  }
  // Bare client ghost IDs are not accepted — possession must be proven with
  // verifyClientOrphanGhostPossession before reaching this list.

  candidates.delete(input.currentGhostId);
  return [...candidates];
}
