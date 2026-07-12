export function discoverOrphanGhostIds(input: {
  currentGhostId: string;
  rebindPreviousGhostId: string | null;
  historicalGhostIds: string[];
  clientOrphanGhostIds?: string[];
}): string[] {
  const candidates = new Set<string>();

  if (input.rebindPreviousGhostId) {
    candidates.add(input.rebindPreviousGhostId);
  }
  for (const ghostId of input.historicalGhostIds) {
    if (ghostId) candidates.add(ghostId);
  }
  for (const ghostId of input.clientOrphanGhostIds ?? []) {
    if (ghostId) candidates.add(ghostId);
  }

  candidates.delete(input.currentGhostId);
  return [...candidates];
}
