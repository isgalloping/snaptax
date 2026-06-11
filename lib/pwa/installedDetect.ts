import { isStandaloneDisplayMode } from "./deferredInstall";

export const PWA_INSTALLED_KEY = "snap1099_pwa_installed";

type RelatedWebApp = {
  platform?: string;
  url?: string;
  id?: string;
};

export type InstalledSignalInput = {
  standalone: boolean;
  hasRelatedAppsApi: boolean;
  relatedAppCount: number;
  stickyLocal: boolean;
};

export type InstalledSignalResult = {
  installed: boolean;
  shouldMarkLocal: boolean;
  shouldClearLocal: boolean;
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

export function evaluateInstalledSignals(
  input: InstalledSignalInput,
): InstalledSignalResult {
  if (input.standalone) {
    return {
      installed: true,
      shouldMarkLocal: true,
      shouldClearLocal: false,
    };
  }

  if (input.hasRelatedAppsApi) {
    if (input.relatedAppCount > 0) {
      return {
        installed: true,
        shouldMarkLocal: true,
        shouldClearLocal: false,
      };
    }
    return {
      installed: false,
      shouldMarkLocal: false,
      shouldClearLocal: input.stickyLocal,
    };
  }

  if (input.stickyLocal) {
    return {
      installed: true,
      shouldMarkLocal: false,
      shouldClearLocal: false,
    };
  }

  return {
    installed: false,
    shouldMarkLocal: false,
    shouldClearLocal: false,
  };
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

/** True when running as installed PWA or same-profile install signals are present. */
export async function isPwaInstalledOnDevice(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const standalone = isStandaloneDisplayMode();
  const stickyLocal = readPwaInstalledLocally();
  const hasRelatedAppsApi =
    typeof navigator !== "undefined" &&
    typeof (
      navigator as Navigator & {
        getInstalledRelatedApps?: () => Promise<RelatedWebApp[]>;
      }
    ).getInstalledRelatedApps === "function";

  const related = hasRelatedAppsApi ? await queryInstalledRelatedApps() : [];

  const result = evaluateInstalledSignals({
    standalone,
    hasRelatedAppsApi,
    relatedAppCount: related.length,
    stickyLocal,
  });

  if (result.shouldMarkLocal) markPwaInstalledLocally();
  if (result.shouldClearLocal) clearPwaInstalledLocally();

  return result.installed;
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
