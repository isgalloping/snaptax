import { clearAllLocalData } from "@/lib/storage/receiptDb";

const SNAP1099_LS_PREFIX = "snap1099_";

/** Wipes IndexedDB (incl. `cloud_restore_attempted` in system_meta) and snap1099_* localStorage. */
export async function clearLocalAppData(): Promise<void> {
  await clearAllLocalData();
  if (typeof localStorage !== "undefined") {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(SNAP1099_LS_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
}

export const GHOST_STORAGE_KEY = "snap1099_ghost_id";
export const REGION_CANDIDATE_STORAGE_KEY = "snap1099_region_candidate";
