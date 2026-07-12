import { taxRegionHeaders } from "@/lib/client/taxRegion";

const GHOST_UI_KEY = "snap1099_ghost_id";
const KNOWN_GHOST_IDS_KEY = "snap1099_known_ghost_ids";
const MAX_KNOWN_GHOST_IDS = 20;

let ghostSessionInFlight: Promise<string> | null = null;

function readKnownGhostIds(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KNOWN_GHOST_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
  } catch {
    return [];
  }
}

function writeKnownGhostIds(ids: string[]): void {
  if (typeof localStorage === "undefined") return;
  const unique = [...new Set(ids)];
  localStorage.setItem(
    KNOWN_GHOST_IDS_KEY,
    JSON.stringify(unique.slice(-MAX_KNOWN_GHOST_IDS)),
  );
}

export function rememberKnownGhostId(ghostId: string): void {
  if (!ghostId) return;
  const ids = readKnownGhostIds();
  if (ids.includes(ghostId)) return;
  writeKnownGhostIds([...ids, ghostId]);
}

/** Client-known ghosts minus current cookie ghost (for orphan merge on login). */
export function getClientOrphanGhostIds(currentGhostId: string): string[] {
  return readKnownGhostIds().filter((id) => id !== currentGhostId);
}

async function postGhostRegister(): Promise<string> {
  const previousGhostId =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(GHOST_UI_KEY)
      : null;

  const res = await fetch("/api/ghost/register", {
    method: "POST",
    credentials: "include",
    headers: {
      ...taxRegionHeaders(),
    },
  });
  if (!res.ok) throw new Error("ghost register failed");
  const { ghostId } = (await res.json()) as {
    ghostId: string;
    reused?: boolean;
  };
  if (typeof localStorage !== "undefined") {
    if (previousGhostId && previousGhostId !== ghostId) {
      rememberKnownGhostId(previousGhostId);
    }
    rememberKnownGhostId(ghostId);
    localStorage.setItem(GHOST_UI_KEY, ghostId);
  }
  return ghostId;
}

/** Share one in-flight POST so batch/OCR paths do not stampede ghost/register. */
export async function ensureGhostSession(): Promise<string> {
  if (!ghostSessionInFlight) {
    ghostSessionInFlight = postGhostRegister().finally(() => {
      ghostSessionInFlight = null;
    });
  }
  return ghostSessionInFlight;
}

export function resetGhostSessionFlightForTests(): void {
  ghostSessionInFlight = null;
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  return fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      ...taxRegionHeaders(),
      ...(init.headers ?? {}),
    },
  });
}
