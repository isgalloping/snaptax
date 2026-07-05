/** Root-level filenames commonly targeted by automated secret scanners. */
const ROOT_PROBE_FILES = new Set(
  [
    "service-account.json",
    "credentials.json",
    "google-credentials.json",
    "gcp-credentials.json",
    "firebase-adminsdk.json",
    "account.json",
    "keyfile.json",
    "config.json",
    "appsettings.json",
  ].map((name) => name.toLowerCase()),
);

const API_PROBE_PATHS = new Set(["/api/env", "/api/config"]);

/**
 * True for automated vulnerability scans (.env, .git, credential dumps).
 * These should never exist; respond 404 at the edge without app work.
 */
export function isAutomatedSecurityProbe(pathname: string): boolean {
  const path = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  const lower = path.toLowerCase();

  if (lower.startsWith("/.env")) return true;
  if (lower.startsWith("/.git")) return true;
  if (API_PROBE_PATHS.has(lower)) return true;

  const segments = lower.split("/").filter(Boolean);
  if (segments.length !== 1) return false;

  return ROOT_PROBE_FILES.has(segments[0]!);
}
