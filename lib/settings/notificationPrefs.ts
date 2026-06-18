export type NotificationPrefKey =
  | "deadlines"
  | "deductions"
  | "receipts"
  | "marketing";

const STORAGE_KEYS: Record<NotificationPrefKey, string> = {
  deadlines: "snap1099_notif_deadlines",
  deductions: "snap1099_notif_deductions",
  receipts: "snap1099_notif_receipts",
  marketing: "snap1099_notif_marketing",
};

const DEFAULTS: Record<NotificationPrefKey, boolean> = {
  deadlines: true,
  deductions: true,
  receipts: true,
  marketing: false,
};

export type NotificationPrefs = Record<NotificationPrefKey, boolean>;

function getLocalStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  const globalStorage = (globalThis as { localStorage?: Storage }).localStorage;
  return globalStorage ?? null;
}

function readFlag(key: NotificationPrefKey): boolean {
  const storage = getLocalStorage();
  if (!storage) return DEFAULTS[key];
  const raw = storage.getItem(STORAGE_KEYS[key]);
  if (raw === null) return DEFAULTS[key];
  return raw === "1";
}

export function readNotificationPrefs(): NotificationPrefs {
  return {
    deadlines: readFlag("deadlines"),
    deductions: readFlag("deductions"),
    receipts: readFlag("receipts"),
    marketing: readFlag("marketing"),
  };
}

export function writeNotificationPref(
  key: NotificationPrefKey,
  enabled: boolean,
): void {
  const storage = getLocalStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEYS[key], enabled ? "1" : "0");
}

export function countEnabledPrefs(prefs: NotificationPrefs): number {
  return Object.values(prefs).filter(Boolean).length;
}
