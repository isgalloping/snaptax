export function discoverOrphanGhostIds(input: {
  currentGhostId: string;
  rebindPreviousGhostId: string | null;
  historicalGhostIds: string[];
}): string[] {
  const candidates = new Set<string>();

  if (input.rebindPreviousGhostId) {
    candidates.add(input.rebindPreviousGhostId);
  }
  for (const ghostId of input.historicalGhostIds) {
    if (ghostId) candidates.add(ghostId);
  }
  // Client-supplied ghost IDs are not proof of possession; only merge IDs the
  // server can derive from existing user state.

  candidates.delete(input.currentGhostId);
  return [...candidates];
}
