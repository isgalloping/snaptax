import { clearAllLocalData } from "@/lib/storage/receiptDb";

const GHOST_KEY = "snap1099_ghost_id";
const REGION_CANDIDATE_KEY = "snap1099_region_candidate";

export async function clearLocalAppData(): Promise<void> {
  await clearAllLocalData();
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(GHOST_KEY);
    localStorage.removeItem(REGION_CANDIDATE_KEY);
  }
}

export const GHOST_STORAGE_KEY = GHOST_KEY;
export const REGION_CANDIDATE_STORAGE_KEY = REGION_CANDIDATE_KEY;
