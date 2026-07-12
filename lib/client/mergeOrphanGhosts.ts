import {
  apiFetch,
  ensureGhostSession,
  getClientOrphanGhostIds,
} from "@/lib/client/ghostClient";

export type OrphanGhostMergeClientResult = {
  mergedGhostIds: string[];
  totalReceipts: number;
};

/** Best-effort post-login merge for receipts on rotated ghost cookies. */
export async function mergeOrphanGhostsOnLogin(): Promise<OrphanGhostMergeClientResult | null> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return null;

  try {
    const currentGhostId = await ensureGhostSession();
    const orphanGhostIds = getClientOrphanGhostIds(currentGhostId);
    if (orphanGhostIds.length === 0) return null;

    const res = await apiFetch("/api/sync/ghost-orphans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orphanGhostIds }),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as OrphanGhostMergeClientResult;
    return data;
  } catch {
    return null;
  }
}
