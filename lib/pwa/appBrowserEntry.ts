import { isLandingDone, isStandaloneDisplayMode } from "@/lib/pwa/deferredInstall";
import {
  detectInstallPlatform,
  isAndroidChromeWebApkBrowser,
} from "@/lib/pwa/installPlatform";

export const APP_ENTRY_GATE_DISMISSED_KEY = "snaptax_app_entry_gate_dismissed";
export const APP_ENTRY_GATE_DISMISSED_EVENT = "snap1099:app-entry-gate-dismissed";

export type AppBrowserEntryGateReason =
  | "eligible"
  | "standalone"
  | "dismissed"
  | "landing-pending"
  | "wrong-platform"
  | "wrong-path";

export function readAppEntryGateDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(APP_ENTRY_GATE_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissAppEntryGate(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(APP_ENTRY_GATE_DISMISSED_KEY, "1");
  } catch {
    // ignore
  }
}

/** Android Chrome WebAPK or iOS/iPad Safari — full-screen gate platforms. */
export function isAppBrowserEntryPlatform(userAgent: string): boolean {
  if (isAndroidChromeWebApkBrowser(userAgent)) return true;
  return detectInstallPlatform(userAgent) === "ios-safari";
}

export function evaluateAppBrowserEntryGate(input: {
  pathname: string;
  standalone: boolean;
  landingDone: boolean;
  gateDismissed: boolean;
  userAgent: string;
}): AppBrowserEntryGateReason {
  if (input.standalone) return "standalone";
  if (!input.pathname.startsWith("/app")) return "wrong-path";
  if (!isAppBrowserEntryPlatform(input.userAgent)) return "wrong-platform";
  if (!input.landingDone) return "landing-pending";
  if (input.gateDismissed) return "dismissed";
  return "eligible";
}

export function shouldSuppressInstallBarAfterGateSkip(): boolean {
  return readAppEntryGateDismissed();
}

export function readAppBrowserEntryGateEligibility(pathname: string): AppBrowserEntryGateReason {
  if (typeof window === "undefined") return "wrong-path";
  return evaluateAppBrowserEntryGate({
    pathname,
    standalone: isStandaloneDisplayMode(),
    landingDone: isLandingDone(),
    gateDismissed: readAppEntryGateDismissed(),
    userAgent: navigator.userAgent,
  });
}
