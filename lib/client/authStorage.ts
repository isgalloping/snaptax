import type { Industry } from "@/lib/types";

export interface GoogleUser {
  email: string;
  name: string;
}

const USER_KEY = "snap1099_google_user";
const INDUSTRY_KEY = "snap1099_industry";
const PAID_PREFIX = "snap1099_season_paid_";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadGoogleUser(): GoogleUser | null {
  return readJson<GoogleUser>(USER_KEY);
}

export function saveGoogleUser(user: GoogleUser | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function isSeasonPaid(season = "2026"): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${PAID_PREFIX}${season}`) === "1";
}

export function setSeasonPaid(season: string, paid: boolean): void {
  if (typeof window === "undefined") return;
  const key = `${PAID_PREFIX}${season}`;
  if (paid) localStorage.setItem(key, "1");
  else localStorage.removeItem(key);
}

const INDUSTRY_IDS: Industry[] = [
  "truck_driver",
  "plumber",
  "electrician",
  "construction",
  "delivery",
  "general",
];

export function loadIndustry(): Industry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(INDUSTRY_KEY);
    if (!raw) return null;
    return INDUSTRY_IDS.includes(raw as Industry) ? (raw as Industry) : null;
  } catch {
    return null;
  }
}

export function saveIndustry(industry: Industry | null): void {
  if (typeof window === "undefined") return;
  try {
    if (industry) localStorage.setItem(INDUSTRY_KEY, industry);
    else localStorage.removeItem(INDUSTRY_KEY);
  } catch {
    // private mode / quota
  }
}
