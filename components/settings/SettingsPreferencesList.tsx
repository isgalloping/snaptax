"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { Industry } from "@/lib/types";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  countEnabledPrefs,
  readNotificationPrefs,
} from "@/lib/settings/notificationPrefs";
import type { SettingsViewState } from "@/components/settings/settingsViewState";
import { settingsVisual } from "@/lib/ui/settingsVisual";

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

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-400" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function IndustryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-600" aria-hidden fill="currentColor">
      <path d="M12 2L4 7v2h16V7L12 2zm-8 9v9h16v-9H4zm6 2h4v5h-4v-5z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-yellow-500" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-purple-400" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PrefRow({
  icon,
  label,
  preview,
  onClick,
  showDivider,
}: {
  icon: ReactNode;
  label: string;
  preview?: ReactNode;
  onClick: () => void;
  showDivider?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${settingsVisual.preferences.row}${showDivider ? ` ${settingsVisual.preferences.divider}` : ""}`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1 text-sm font-bold text-white">{label}</span>
      <span className="flex items-center gap-2">
        {preview}
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
    <section className="mb-4">
      <p className={settingsVisual.sectionHeading}>{copy.settings.preferences.title}</p>
      <div className={settingsVisual.preferences.container}>
        <PrefRow
          icon={<GlobeIcon />}
          label={listCopy.language}
          preview={
            <span className="text-xs font-bold text-zinc-400">
              {languageLabels[locale]}
            </span>
          }
          onClick={() => onNavigate("language")}
        />
        <PrefRow
          icon={<IndustryIcon />}
          label={listCopy.industry}
          preview={
            <span className="text-xs font-bold text-zinc-400">{industryPreview}</span>
          }
          onClick={() => onNavigate("industry")}
          showDivider
        />
        <PrefRow
          icon={<BellIcon />}
          label={listCopy.notifications}
          preview={
            <span className={settingsVisual.preferences.notifPill}>
              {listCopy.notificationsOn.replace("{count}", String(notifCount))}
            </span>
          }
          onClick={() => onNavigate("notifications")}
          showDivider
        />
        <PrefRow
          icon={<ShieldIcon />}
          label={listCopy.privacyCenter}
          onClick={() => onNavigate("privacy-center")}
          showDivider
        />
      </div>
    </section>
  );
}
