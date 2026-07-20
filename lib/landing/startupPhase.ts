/** Resume main app shell without replaying cold-start landing.
 * Call only after mount (useLayoutEffect) — not in useState initializers (SSR mismatch). */
export function readStartupShellPhase(): "landing" | "full-home" {
  if (typeof window === "undefined") return "landing";
  if (document.documentElement.classList.contains("landing-done")) {
    return "full-home";
  }
  if (sessionStorage.getItem("snap1099_landing_done") === "1") {
    return "full-home";
  }
  return "landing";
}

export function markLandingDonePersisted(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("snap1099_landing_done", "1");
}

/** Sync DOM + event bus when landing was already completed in a prior visit. */
export function applyLandingDoneToDocument(): void {
  if (typeof window === "undefined") return;
  markLandingDonePersisted();
  if (!document.documentElement.classList.contains("landing-done")) {
    document.documentElement.classList.add("landing-done");
    window.dispatchEvent(new Event("snap1099:landing-done"));
  }
}
