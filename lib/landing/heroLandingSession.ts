/** In-tab hero dwell session — blocks LandingGate poll exit until CTA (see hero-countdown design). */

let heroSessionActive = false;
let heroSessionStartedAt: number | null = null;

export function beginHeroLandingSession(): void {
  heroSessionActive = true;
  heroSessionStartedAt = performance.now();
}

export function endHeroLandingSession(): void {
  heroSessionActive = false;
  heroSessionStartedAt = null;
}

export function isHeroLandingSessionActive(): boolean {
  return heroSessionActive;
}

export function heroSessionElapsedMs(): number {
  if (heroSessionStartedAt == null) return 0;
  return performance.now() - heroSessionStartedAt;
}

/** Seconds remaining for button countdown (3 → 2 → 1). */
export function heroCountdownSeconds(
  autoAdvanceMs: number,
  elapsedMs = heroSessionElapsedMs(),
): number {
  const remainingMs = Math.max(0, autoAdvanceMs - elapsedMs);
  return Math.max(1, Math.ceil(remainingMs / 1000));
}
