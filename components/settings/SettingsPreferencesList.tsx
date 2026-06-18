"use client";

import { useEffect, useState } from "react";
import type { Industry } from "@/lib/types";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  countEnabledPrefs,
  readNotificationPrefs,
} from "@/lib/settings/notificationPrefs";
import type { SettingsViewState } from "@/components/settings/settingsViewState";

interface SettingsPreferencesListProps {
  industry: Industry | null;
  onNavigate: (view: SettingsViewState) => void;
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-zinc-500"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PrefRow({
  label,
  preview,
  onClick,
}: {
  label: string;
  preview?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 py-3 text-left transition-transform active:scale-[0.99]"
    >
      <span className="text-sm font-bold text-white">{label}</span>
      <span className="flex items-center gap-2">
        {preview && (
          <span className="text-xs font-bold text-zinc-400">{preview}</span>
        )}
        <ChevronRight />
      </span>
    </button>
  );
}

export function SettingsPreferencesList({
  industry,
  onNavigate,
}: SettingsPreferencesListProps) {
  const { locale, copy } = useI18n();
  const listCopy = copy.settings.preferencesList;
  const [notifCount, setNotifCount] = useState(3);

  useEffect(() => {
    setNotifCount(countEnabledPrefs(readNotificationPrefs()));
  }, []);

  const languageLabels = {
    "en-US": copy.settings.language.english,
    "fr-FR": copy.settings.language.french,
    "de-DE": copy.settings.language.german,
  } as const;

  const industryPreview =
    industry != null
      ? copy.settings.industry.labels[industry]
      : copy.settings.industry.labels.general;

  return (
    <section className="mb-8 space-y-2">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
        {copy.settings.preferences.title}
      </p>
      <PrefRow
        label={listCopy.language}
        preview={languageLabels[locale]}
        onClick={() => onNavigate("language")}
      />
      <PrefRow
        label={listCopy.industry}
        preview={industryPreview}
        onClick={() => onNavigate("industry")}
      />
      <PrefRow
        label={listCopy.notifications}
        preview={listCopy.notificationsOn.replace("{count}", String(notifCount))}
        onClick={() => onNavigate("notifications")}
      />
      <PrefRow
        label={listCopy.privacyCenter}
        onClick={() => onNavigate("privacy-center")}
      />
    </section>
  );
}
