const SAMPLE_EXPORT_DONE_KEY = "snap1099_settings_sample_export_done";
const EXPORT_BLOCKED_KEY = "snap1099_settings_export_blocked";

export function isSampleExportDone(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SAMPLE_EXPORT_DONE_KEY) === "1";
}

export function markSampleExportDone(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAMPLE_EXPORT_DONE_KEY, "1");
}

export function clearSampleExportDone(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SAMPLE_EXPORT_DONE_KEY);
}

export function isExportBlockedBannerActive(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(EXPORT_BLOCKED_KEY) === "1";
}

export function markExportBlockedBanner(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(EXPORT_BLOCKED_KEY, "1");
}

export function dismissExportBlockedBanner(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(EXPORT_BLOCKED_KEY);
}
