export const INSTALL_DISMISS_KEY = "snap1099_pwa_install_dismissed_at";
export const INSTALL_VISIT_KEY = "snap1099_pwa_has_visited";
export const LANDING_DONE_EVENT = "snap1099:landing-done";

import {
  getInstallPlatform,
  isInstallPlatformEligible,
  type InstallPlatform,
} from "@/lib/pwa/installPlatform";

export type InstallUiMode = "none" | "bar" | "header-button";

const MS_PER_DAY = 86_400_000;

/** @deprecated Permanent header mode — kept for tests referencing TTL helper */
export const INSTALL_DISMISS_DAYS = 7;

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type SnapInstallWindow = Window & {
  __snap1099DeferredInstall?: BeforeInstallPromptEvent | null;
  __snap1099InstallListeners?: Array<() => void>;
  __snap1099InstallCaptureReady?: boolean;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function isDismissedWithinWindow(
  dismissedAtIso: string | null,
  nowMs: number,
): boolean {
  if (!dismissedAtIso) return false;
  const dismissedAt = Date.parse(dismissedAtIso);
  if (Number.isNaN(dismissedAt)) return false;
  return nowMs - dismissedAt < INSTALL_DISMISS_DAYS * MS_PER_DAY;
}

export function readInstallDismissedAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(INSTALL_DISMISS_KEY);
  } catch {
    return null;
  }
}

export function isInstallDismissed(nowMs = Date.now()): boolean {
  return hasDismissedInstallBar();
}

export function hasDismissedInstallBar(): boolean {
  return readInstallDismissedAt() != null;
}

export function hasPwaVisited(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(INSTALL_VISIT_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPwaVisited(): void {
  if (typeof window === "undefined") return;
  if (hasPwaVisited()) return;
  try {
    localStorage.setItem(INSTALL_VISIT_KEY, "1");
  } catch {
    // ignore
  }
}

export function dismissInstallBar(now = new Date()): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INSTALL_DISMISS_KEY, now.toISOString());
  } catch {
    // private mode / quota — ignore
  }
}

/** @deprecated Use dismissInstallBar */
export function dismissInstallPrompt(now = new Date()): void {
  dismissInstallBar(now);
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

/** @deprecated Use isStandaloneDisplayMode */
export function isAndroidInstallableBrowser(
  userAgent: string,
  standalone: boolean,
): boolean {
  if (standalone) return false;
  return (
    /Android/i.test(userAgent) &&
    (/Chrome/i.test(userAgent) || /EdgA/i.test(userAgent))
  );
}

export function getCurrentInstallPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "none";
  return getInstallPlatform();
}

export function isLandingDone(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("landing-done");
}

function syncDeferredFromWindow(): void {
  if (typeof window === "undefined") return;
  const snap = window as SnapInstallWindow;
  if (snap.__snap1099DeferredInstall) {
    deferredPrompt = snap.__snap1099DeferredInstall;
  } else if (snap.__snap1099DeferredInstall === null) {
    deferredPrompt = null;
  }
}

export function initDeferredInstallCapture(): void {
  if (typeof window === "undefined") return;

  const snap = window as SnapInstallWindow;

  syncDeferredFromWindow();

  snap.__snap1099InstallListeners = snap.__snap1099InstallListeners ?? [];
  snap.__snap1099InstallListeners.push(() => {
    syncDeferredFromWindow();
    notifyListeners();
  });

  if (snap.__snap1099InstallCaptureReady) return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    snap.__snap1099DeferredInstall = deferredPrompt;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    snap.__snap1099DeferredInstall = null;
    void import("./installedDetect").then(({ markPwaInstalledLocally }) => {
      markPwaInstalledLocally();
    });
    notifyListeners();
  });
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  syncDeferredFromWindow();
  return deferredPrompt;
}

export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null;
  if (typeof window !== "undefined") {
    (window as SnapInstallWindow).__snap1099DeferredInstall = null;
  }
  notifyListeners();
}

export function canNativeInstallPrompt(): boolean {
  return getDeferredInstallPrompt() != null;
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeLandingDone(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onLandingDone = () => listener();
  window.addEventListener(LANDING_DONE_EVENT, onLandingDone);

  let observer: MutationObserver | null = null;

  if (isLandingDone()) {
    listener();
  } else {
    observer = new MutationObserver(() => {
      if (isLandingDone()) {
        observer?.disconnect();
        observer = null;
        listener();
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  return () => {
    window.removeEventListener(LANDING_DONE_EVENT, onLandingDone);
    observer?.disconnect();
  };
}

export function isInstallEligible(): boolean {
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplayMode()) return false;
  if (!isLandingDone()) return false;
  return isInstallPlatformEligible(getCurrentInstallPlatform());
}

export function resolveInstallUiMode(
  eligible: boolean,
  dismissedBar: boolean,
): InstallUiMode {
  if (!eligible) return "none";
  if (dismissedBar) return "header-button";
  return "bar";
}

export function getInstallUiMode(): InstallUiMode {
  return resolveInstallUiMode(isInstallEligible(), hasDismissedInstallBar());
}

export function shouldShowInstallBar(): boolean {
  return getInstallUiMode() === "bar";
}

/** @deprecated Use getInstallUiMode */
export function shouldShowInstallPrompt(): boolean {
  return shouldShowInstallBar();
}

initDeferredInstallCapture();
