export interface GoogleUser {
  email: string;
  name: string;
}

const USER_KEY = "snap1099_google_user";
const BANNER_DISMISSED_KEY = "snap1099_soft_banner_dismissed";
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

export function isSoftBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(BANNER_DISMISSED_KEY) === "1";
}

export function dismissSoftBannerForever(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BANNER_DISMISSED_KEY, "1");
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

/** MVP UI mock — replace with Google Identity Services + `/api/auth/google` */
export async function mockGoogleSignIn(): Promise<GoogleUser> {
  await new Promise((r) => setTimeout(r, 400));
  const user: GoogleUser = {
    email: "user@gmail.com",
    name: "Demo User",
  };
  saveGoogleUser(user);
  return user;
}
