import type { SettingsViewState } from "@/components/settings/settingsViewState";
import { isStandaloneDisplayMode } from "@/lib/pwa/deferredInstall";

export const SNAP_NAV_STATE_KEY = "snap1099";

export type SnapNavKey =
  | { kind: "home" }
  | { kind: "overlay"; overlayId: string; hintId?: string }
  | { kind: "settings"; page: SettingsViewState };

export type DecodedNavTarget = {
  view: "home" | "settings";
  homeOverlay: HomeOverlayNav | null;
  settingsPage: SettingsViewState;
};

/** Serializable overlay ids aligned with HomeOverlayHost. */
export type HomeOverlayNav =
  | "privacy-trust"
  | "deadline-detail"
  | "tax-year-detail"
  | "missing-deductions"
  | { type: "missing-deduction-item"; hintId: string };

export function encodeNavKey(key: SnapNavKey): string {
  if (key.kind === "home") return "home";
  if (key.kind === "overlay") {
    if (key.overlayId === "missing-deduction-item" && key.hintId) {
      return `overlay:missing-deduction-item:${key.hintId}`;
    }
    return `overlay:${key.overlayId}`;
  }
  if (key.page === "main") return "settings";
  return `settings:${key.page}`;
}

export function decodeNavKey(encoded: string | undefined | null): SnapNavKey | null {
  if (!encoded || encoded === "home") return { kind: "home" };
  if (encoded === "settings") return { kind: "settings", page: "main" };
  if (encoded.startsWith("settings:")) {
    const page = encoded.slice("settings:".length) as SettingsViewState;
    return { kind: "settings", page };
  }
  if (encoded.startsWith("overlay:missing-deduction-item:")) {
    const hintId = encoded.slice("overlay:missing-deduction-item:".length);
    if (!hintId) return null;
    return {
      kind: "overlay",
      overlayId: "missing-deduction-item",
      hintId,
    };
  }
  if (encoded.startsWith("overlay:")) {
    const overlayId = encoded.slice("overlay:".length);
    if (!overlayId) return null;
    return { kind: "overlay", overlayId };
  }
  return null;
}

export function readCurrentNavKey(): SnapNavKey | null {
  if (typeof window === "undefined") return null;
  const raw = (history.state as { snap1099?: string } | null)?.snap1099;
  return decodeNavKey(raw ?? "home");
}

export function shouldPushNavKey(current: SnapNavKey | null, next: SnapNavKey): boolean {
  if (!current) return true;
  return encodeNavKey(current) !== encodeNavKey(next);
}

export function mapNavKeyToTarget(key: SnapNavKey): DecodedNavTarget {
  if (key.kind === "home") {
    return { view: "home", homeOverlay: null, settingsPage: "main" };
  }
  if (key.kind === "overlay") {
    const homeOverlay: HomeOverlayNav =
      key.overlayId === "missing-deduction-item" && key.hintId
        ? { type: "missing-deduction-item", hintId: key.hintId }
        : (key.overlayId as HomeOverlayNav);
    return { view: "home", homeOverlay, settingsPage: "main" };
  }
  return { view: "settings", homeOverlay: null, settingsPage: key.page };
}

export function homeOverlayNavToKey(overlay: HomeOverlayNav): SnapNavKey {
  if (typeof overlay === "object" && overlay.type === "missing-deduction-item") {
    return {
      kind: "overlay",
      overlayId: "missing-deduction-item",
      hintId: overlay.hintId,
    };
  }
  return { kind: "overlay", overlayId: overlay as string };
}

export function isLeavingExportCompleted(
  prev: SettingsViewState,
  next: SettingsViewState,
): boolean {
  return prev === "export-completed" && next !== "export-completed";
}

let navTrapBootstrapped = false;

export function bootstrapNavTrap(): void {
  if (typeof window === "undefined" || navTrapBootstrapped) return;
  navTrapBootstrapped = true;
  const state = { [SNAP_NAV_STATE_KEY]: "home" };
  history.replaceState(state, "");
  history.pushState(state, "");
}

export function pushNavScreen(key: SnapNavKey): void {
  if (typeof window === "undefined") return;
  const current = readCurrentNavKey();
  if (!shouldPushNavKey(current, key)) return;
  history.pushState({ [SNAP_NAV_STATE_KEY]: encodeNavKey(key) }, "");
}

export function replaceNavScreen(key: SnapNavKey): void {
  if (typeof window === "undefined") return;
  history.replaceState({ [SNAP_NAV_STATE_KEY]: encodeNavKey(key) }, "");
}

export function restoreHomeNavTrap(): void {
  if (typeof window === "undefined") return;
  history.pushState({ [SNAP_NAV_STATE_KEY]: "home" }, "");
}

export function confirmAppExit(): void {
  if (typeof window === "undefined") return;
  navigateBackScreen();
  window.setTimeout(() => navigateBackScreen(), 0);
  if (isStandaloneDisplayMode()) {
    window.close();
  }
}

export function navigateBackScreen(): void {
  if (typeof window === "undefined") return;
  history.back();
}

export function decodePopStateEvent(state: unknown): SnapNavKey | null {
  if (!state || typeof state !== "object") return { kind: "home" };
  const raw = (state as { snap1099?: string }).snap1099;
  return decodeNavKey(raw ?? "home");
}

/** @internal test helper */
export function resetNavTrapForTests(): void {
  navTrapBootstrapped = false;
}
