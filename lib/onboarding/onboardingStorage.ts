export const ONBOARD_SNAP_DISMISSED_KEY = "snap1099_onboard_snap_hint_dismissed";
export const ONBOARD_FIRST_RECEIPT_KEY = "snap1099_onboard_first_receipt_coach";
export const GOOGLE_SOFT_DISMISSED_KEY = "snap1099_google_soft_dismissed";

export function readOnboardFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeOnboardFlag(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, "1");
  } catch {
    // private mode / quota
  }
}

export function isSnapCoachEligible(input: {
  receiptCount: number;
  dismissed: boolean;
  pwaBarVisible: boolean;
}): boolean {
  return (
    input.receiptCount === 0 && !input.dismissed && !input.pwaBarVisible
  );
}

export function isFirstReceiptCoachEligible(input: {
  receiptCount: number;
  coachDone: boolean;
}): boolean {
  return input.receiptCount >= 1 && input.receiptCount < 2 && !input.coachDone;
}

export function isGoogleNudgeEligible(input: {
  receiptCount: number;
  signedIn: boolean;
  dismissed: boolean;
  pwaBarVisible: boolean;
}): boolean {
  return (
    input.receiptCount >= 3 &&
    !input.signedIn &&
    !input.dismissed &&
    !input.pwaBarVisible
  );
}
