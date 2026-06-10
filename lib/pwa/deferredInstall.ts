export const INSTALL_DISMISS_KEY = "snap1099_pwa_install_dismissed_at";
export const INSTALL_DISMISS_DAYS = 7;
export const LANDING_DONE_EVENT = "snap1099:landing-done";

const MS_PER_DAY = 86_400_000;

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

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
  return isDismissedWithinWindow(readInstallDismissedAt(), nowMs);
}

export function dismissInstallPrompt(now = new Date()): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INSTALL_DISMISS_KEY, now.toISOString());
  } catch {
    // private mode / quota — ignore
  }
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function isLandingDone(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("landing-done");
}

export function initDeferredInstallCapture(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null;
  notifyListeners();
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

export function shouldShowInstallPrompt(nowMs = Date.now()): boolean {
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplayMode()) return false;
  if (isInstallDismissed(nowMs)) return false;
  if (!isLandingDone()) return false;
  return getDeferredInstallPrompt() != null;
}

initDeferredInstallCapture();
