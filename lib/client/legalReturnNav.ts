import {
  decodeNavKey,
  encodeNavKey,
  type SnapNavKey,
} from "@/lib/client/appNavigationHistory";

const LEGAL_RETURN_KEY = "snap1099_legal_return";

export const LEGAL_RETURN_EVENT = "snap1099:legal-return";

export function saveLegalReturnNav(key: SnapNavKey): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LEGAL_RETURN_KEY, encodeNavKey(key));
}

export function peekLegalReturnNav(): SnapNavKey | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(LEGAL_RETURN_KEY);
  if (!raw) return null;
  return decodeNavKey(raw);
}

export function consumeLegalReturnNav(): SnapNavKey | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(LEGAL_RETURN_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(LEGAL_RETURN_KEY);
  return decodeNavKey(raw);
}

export function dispatchLegalReturnNav(key: SnapNavKey): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SnapNavKey>(LEGAL_RETURN_EVENT, { detail: key }),
  );
}
