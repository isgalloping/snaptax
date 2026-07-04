/** After Paddle checkout: wait for webhook entitlement, sync client seasonPaid, then founder seat. */
export async function finalizeFounderPurchase(deps: {
  season: string;
  pollEntitlementReady: (season: string, maxMs: number) => Promise<boolean>;
  refreshSeasonPaid: () => Promise<void>;
  waitForFounderActive: () => Promise<boolean>;
  maxWaitMs?: number;
}): Promise<void> {
  const maxWaitMs = deps.maxWaitMs ?? 30_000;
  await deps.pollEntitlementReady(deps.season, maxWaitMs);
  await deps.refreshSeasonPaid();
  await deps.waitForFounderActive();
}
