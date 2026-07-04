export const FOUNDER_WIDGET_SEEN_KEY = "snaptax_founder_widget_seen";

export function readFounderWidgetSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(FOUNDER_WIDGET_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markFounderWidgetSeen(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FOUNDER_WIDGET_SEEN_KEY, "1");
  } catch {
    // quota / private mode
  }
}
