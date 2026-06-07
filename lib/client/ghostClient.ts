import { taxRegionHeaders } from "@/lib/client/taxRegion";

const GHOST_UI_KEY = "snap1099_ghost_id";

export async function ensureGhostSession(): Promise<string> {
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
    localStorage.setItem(GHOST_UI_KEY, ghostId);
  }
  return ghostId;
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
