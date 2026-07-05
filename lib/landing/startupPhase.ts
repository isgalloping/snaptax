/** Resume main app shell without replaying cold-start landing. */
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
