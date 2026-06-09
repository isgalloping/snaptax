export function unreviewedIds(
  sessionIds: readonly string[],
  acceptedIds: ReadonlySet<string>,
): string[] {
  return sessionIds.filter((id) => !acceptedIds.has(id));
}

export function nextUnreviewedId(
  sessionIds: readonly string[],
  acceptedIds: ReadonlySet<string>,
  afterId?: string,
): string | undefined {
  const pending = unreviewedIds(sessionIds, acceptedIds);
  if (pending.length === 0) return undefined;
  if (!afterId) return pending[0];

  const afterIndex = sessionIds.indexOf(afterId);
  if (afterIndex === -1) return pending[0];

  for (let i = afterIndex + 1; i < sessionIds.length; i++) {
    const id = sessionIds[i];
    if (!acceptedIds.has(id)) return id;
  }
  for (const id of sessionIds) {
    if (!acceptedIds.has(id)) return id;
  }
  return undefined;
}

export function isReviewComplete(
  sessionIds: readonly string[],
  acceptedIds: ReadonlySet<string>,
): boolean {
  return unreviewedIds(sessionIds, acceptedIds).length === 0;
}
