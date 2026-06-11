import { isStandaloneDisplayMode } from "./deferredInstall";

export const PWA_INSTALLED_KEY = "snap1099_pwa_installed";

type RelatedWebApp = {
  platform?: string;
  url?: string;
  id?: string;
};

export function readPwaInstalledLocally(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PWA_INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markPwaInstalledLocally(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PWA_INSTALLED_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearPwaInstalledLocally(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PWA_INSTALLED_KEY);
  } catch {
    // ignore
  }
}

async function queryInstalledRelatedApps(): Promise<RelatedWebApp[]> {
  if (typeof navigator === "undefined") return [];
  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<RelatedWebApp[]>;
  };
  if (!nav.getInstalledRelatedApps) return [];
  try {
    return await nav.getInstalledRelatedApps();
  } catch {
    return [];
  }
}

/** True when running as installed PWA or Chromium reports same-origin app installed. */
export async function isPwaInstalledOnDevice(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (isStandaloneDisplayMode()) return true;

  const related = await queryInstalledRelatedApps();
  if (related.length > 0) {
    markPwaInstalledLocally();
    return true;
  }

  if (readPwaInstalledLocally()) {
    clearPwaInstalledLocally();
  }
  return false;
}

export function resolveInstallUiModeWithInstalled(
  installedOnDevice: boolean,
  eligible: boolean,
  dismissedBar: boolean,
): "none" | "bar" | "header-button" {
  if (installedOnDevice || !eligible) return "none";
  if (dismissedBar) return "header-button";
  return "bar";
}
