import { clearAllLocalData } from "@/lib/storage/receiptDb";
import { FOUNDER_WIDGET_SEEN_KEY } from "@/lib/founder/founderStorage";

const SNAP1099_LS_PREFIX = "snap1099_";

/** Survives partial wipe so UI can finish local erase after cloud delete succeeded. */
export const PENDING_LOCAL_WIPE_KEY = "snap1099_pending_local_wipe";

function clearPrefixedWebStorage(
  storage: Storage,
  prefix: string,
  keepKeys: ReadonlySet<string> = new Set(),
): void {
  for (let i = storage.length - 1; i >= 0; i--) {
    const key = storage.key(i);
    if (!key?.startsWith(prefix)) continue;
    if (keepKeys.has(key)) continue;
    storage.removeItem(key);
  }
}

async function clearCacheStorageBestEffort(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  } catch {
    /* best-effort — SW / Cache API may be unavailable */
  }
}

export function markPendingLocalWipe(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PENDING_LOCAL_WIPE_KEY, "1");
}

export function hasPendingLocalWipe(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(PENDING_LOCAL_WIPE_KEY) === "1";
}

export function clearPendingLocalWipeFlag(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(PENDING_LOCAL_WIPE_KEY);
}

/**
 * Wipes IndexedDB/OPFS, snap1099_* localStorage + sessionStorage,
 * founder widget key, and Cache Storage (best-effort).
 */
export async function clearLocalAppData(): Promise<void> {
  await clearAllLocalData();
  if (typeof localStorage !== "undefined") {
    clearPrefixedWebStorage(
      localStorage,
      SNAP1099_LS_PREFIX,
      new Set([PENDING_LOCAL_WIPE_KEY]),
    );
    localStorage.removeItem(FOUNDER_WIDGET_SEEN_KEY);
  }
  if (typeof sessionStorage !== "undefined") {
    clearPrefixedWebStorage(sessionStorage, SNAP1099_LS_PREFIX);
  }
  await clearCacheStorageBestEffort();
  clearPendingLocalWipeFlag();
}

export const GHOST_STORAGE_KEY = "snap1099_ghost_id";
export const REGION_CANDIDATE_STORAGE_KEY = "snap1099_region_candidate";
