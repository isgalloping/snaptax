import type { LandingVariant } from "@/lib/landing/landingVariant";

export const LANDING_MIN_MS = 2400;
export const LANDING_SOFT_MAX_MS = 5000;
export const LANDING_FADE_MS = 200;
export const LANDING_POLL_MS = 100;

export type LandingExitMode = "full-home" | "offline-pack";

/** Elapsed ms since navigation start — aligns with SSR landing CSS animation from first paint. */
export function landingElapsedMs(): number {
  return performance.now();
}

export function resolveExit(
  elapsedMs: number,
  homeChunkReady: boolean,
  variant: LandingVariant = "data_stream",
): LandingExitMode | null {
  if (elapsedMs >= LANDING_SOFT_MAX_MS) {
    return homeChunkReady ? "full-home" : "offline-pack";
  }

  if (variant === "none") {
    if (homeChunkReady) return "full-home";
    return null;
  }

  if (variant === "hero") {
    return null;
  }

  if (elapsedMs >= LANDING_MIN_MS && homeChunkReady) {
    return "full-home";
  }
  return null;
}
