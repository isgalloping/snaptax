import { taxRegionHeaders } from "@/lib/client/taxRegion";

const GHOST_UI_KEY = "snap1099_ghost_id";
const KNOWN_GHOST_IDS_KEY = "snap1099_known_ghost_ids";
/** Map ghostId → HMAC cookie token (possession proof for orphan merge/delete). */
const KNOWN_GHOST_TOKENS_KEY = "snap1099_known_ghost_tokens";
const MAX_KNOWN_GHOST_IDS = 20;

export type ClientOrphanGhostPossession = {
  ghostId: string;
  token: string;
};

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

function readKnownGhostTokens(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(KNOWN_GHOST_TOKENS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, string> = {};
    for (const [ghostId, token] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (
        typeof ghostId === "string" &&
        ghostId.length > 0 &&
        typeof token === "string" &&
        token.length > 0
      ) {
        out[ghostId] = token;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeKnownGhostTokens(tokens: Record<string, string>): void {
  if (typeof localStorage === "undefined") return;
  const ids = Object.keys(tokens).slice(-MAX_KNOWN_GHOST_IDS);
  const pruned: Record<string, string> = {};
  for (const id of ids) {
    const token = tokens[id];
    if (token) pruned[id] = token;
  }
  localStorage.setItem(KNOWN_GHOST_TOKENS_KEY, JSON.stringify(pruned));
}

export function rememberKnownGhostId(ghostId: string): void {
  if (!ghostId) return;
  const ids = readKnownGhostIds();
  if (ids.includes(ghostId)) return;
  writeKnownGhostIds([...ids, ghostId]);
}

/** Persist HMAC token for a ghost the device has possessed (from register response). */
export function rememberKnownGhostPossession(
  ghostId: string,
  token: string,
): void {
  if (!ghostId || !token) return;
  rememberKnownGhostId(ghostId);
  const tokens = readKnownGhostTokens();
  tokens[ghostId] = token;
  writeKnownGhostTokens(tokens);
}

/** Client-known ghosts minus current cookie ghost (legacy ID list). */
export function getClientOrphanGhostIds(currentGhostId: string): string[] {
  return readKnownGhostIds().filter((id) => id !== currentGhostId);
}

/** Orphan ghosts with HMAC possession proof (for merge / delete APIs). */
export function getClientOrphanGhostPossession(
  currentGhostId: string,
): ClientOrphanGhostPossession[] {
  const tokens = readKnownGhostTokens();
  const orphans: ClientOrphanGhostPossession[] = [];
  for (const ghostId of getClientOrphanGhostIds(currentGhostId)) {
    const token = tokens[ghostId];
    if (token) orphans.push({ ghostId, token });
  }
  return orphans;
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
  const data = (await res.json()) as {
    ghostId: string;
    reused?: boolean;
    ghostToken?: string;
  };
  const { ghostId, ghostToken } = data;
  if (typeof localStorage !== "undefined") {
    if (previousGhostId && previousGhostId !== ghostId) {
      rememberKnownGhostId(previousGhostId);
    }
    rememberKnownGhostId(ghostId);
    if (ghostToken) {
      rememberKnownGhostPossession(ghostId, ghostToken);
    }
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
