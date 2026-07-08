import type { Receipt } from "@/lib/types";
import { readOnboardFlag, GOOGLE_SOFT_DISMISSED_KEY } from "./onboardingStorage";

export const GOOGLE_SOFT_NUDGE_MIN_DONE = 3;
export const GOOGLE_NUDGE_SESSION_KEY = "snap1099_google_nudge_session";

export function countDoneRealReceipts(receipts: Receipt[]): number {
  let done = 0;
  for (const r of receipts) {
    if (r.isOnboardingDemo) continue;
    if (r.status === "done") done++;
  }
  return done;
}

export type GoogleSoftNudgeEligibility = {
  doneCount: number;
  isSignedIn: boolean;
  onboardingCompleted: boolean;
  softDismissed?: boolean;
  shownThisSession?: boolean;
};

export function isGoogleSoftNudgeEligible({
  doneCount,
  isSignedIn,
  onboardingCompleted,
  softDismissed = readOnboardFlag(GOOGLE_SOFT_DISMISSED_KEY),
  shownThisSession = wasGoogleNudgeShownThisSession(),
}: GoogleSoftNudgeEligibility): boolean {
  if (!onboardingCompleted || isSignedIn || softDismissed || shownThisSession) {
    return false;
  }
  return doneCount >= GOOGLE_SOFT_NUDGE_MIN_DONE;
}

export function wasGoogleNudgeShownThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(GOOGLE_NUDGE_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGoogleNudgeSessionShown(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(GOOGLE_NUDGE_SESSION_KEY, "1");
  } catch {
    // private mode / quota
  }
}
