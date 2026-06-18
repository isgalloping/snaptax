"use client";

import { useState } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { SettingsSubPageShell } from "@/components/settings/SettingsSubPageShell";
import {
  readNotificationPrefs,
  writeNotificationPref,
  type NotificationPrefKey,
  type NotificationPrefs,
} from "@/lib/settings/notificationPrefs";

interface NotificationsSubPageProps {
  onBack: () => void;
}

const PREF_KEYS: NotificationPrefKey[] = [
  "deadlines",
  "deductions",
  "receipts",
  "marketing",
];

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 py-3">
      <span className="text-sm font-bold text-white">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
          checked ? "bg-yellow-500" : "bg-zinc-600"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export function NotificationsSubPage({ onBack }: NotificationsSubPageProps) {
  const copy = useUserCopy().settings.notifications;
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => readNotificationPrefs());

  const labels: Record<NotificationPrefKey, string> = {
    deadlines: copy.deadlines,
    deductions: copy.deductions,
    receipts: copy.receipts,
    marketing: copy.marketing,
  };

  const handleToggle = (key: NotificationPrefKey, enabled: boolean) => {
    writeNotificationPref(key, enabled);
    setPrefs((prev) => ({ ...prev, [key]: enabled }));
  };

  return (
    <SettingsSubPageShell title={copy.title} onBack={onBack}>
      <div className="space-y-2">
        {PREF_KEYS.map((key) => (
          <Toggle
            key={key}
            checked={prefs[key]}
            label={labels[key]}
            onChange={(next) => handleToggle(key, next)}
          />
        ))}
      </div>
      <p className="mt-6 text-xs leading-relaxed text-zinc-500">
        {copy.footnoteAlertsSoon}
      </p>
    </SettingsSubPageShell>
  );
}
