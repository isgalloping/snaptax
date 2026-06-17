"use client";

import { useState } from "react";
import Link from "next/link";
import type { Industry } from "@/lib/types";
import { INDUSTRIES } from "@/lib/types";
import { useI18n } from "@/components/i18n/I18nProvider";
import { PrivacyDataSection } from "@/components/settings/PrivacyDataSection";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

interface SettingsPreferencesSectionProps {
  industry: Industry | null;
  onIndustryChange: (industry: Industry) => void;
  isSignedIn: boolean;
  onAccountDeleted?: () => void;
}

export function SettingsPreferencesSection({
  industry,
  onIndustryChange,
  isSignedIn,
  onAccountDeleted,
}: SettingsPreferencesSectionProps) {
  const { locale, setLocale, copy } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const languageLabels: Record<Locale, string> = {
    "en-US": copy.settings.language.english,
    "fr-FR": copy.settings.language.french,
    "de-DE": copy.settings.language.german,
  };

  return (
    <section className="mb-8">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full min-h-14 items-center justify-between rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 py-3 text-left transition-transform active:scale-[0.99]"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          {copy.settings.preferences.title}
        </span>
        <span className="text-sm font-bold text-zinc-500" aria-hidden>
          {expanded ? "▴" : "▾"}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-8 border-l-2 border-zinc-700 pl-4">
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
              {copy.settings.language.title}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_LOCALES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLocale(item)}
                  aria-pressed={locale === item}
                  className={`min-h-14 rounded-xl border-2 p-3 text-center text-xs font-bold transition-transform active:scale-95 ${
                    locale === item
                      ? "border-yellow-500 bg-yellow-950 text-yellow-400"
                      : "border-zinc-600 bg-zinc-800 text-white"
                  }`}
                >
                  {languageLabels[item]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
              {copy.settings.industry.title}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {INDUSTRIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onIndustryChange(item.id)}
                  className={`min-h-14 rounded-xl border-2 p-3 text-left text-xs font-bold transition-transform active:scale-95 ${
                    industry === item.id
                      ? "border-yellow-500 bg-yellow-950 text-yellow-400"
                      : "border-zinc-600 bg-zinc-800 text-white"
                  }`}
                >
                  {copy.settings.industry.labels[item.id]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
              {copy.settings.notifications.title}
            </h3>
            <div className="flex min-h-14 items-center justify-between rounded-xl border-2 border-zinc-700 bg-zinc-800/50 px-4 opacity-60">
              <span className="text-sm font-bold text-zinc-400">
                {copy.settings.notifications.comingSoon}
              </span>
              <button
                type="button"
                disabled
                role="switch"
                aria-checked={false}
                className="relative h-8 w-14 rounded-full bg-zinc-700"
                aria-label={copy.settings.notifications.comingSoon}
              >
                <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-zinc-500" />
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
              {copy.settings.help.title}
            </h3>
            <Link
              href="/help"
              className="block w-full min-h-14 rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4 text-left transition-transform active:scale-95"
            >
              <span className="text-sm font-bold text-white">
                {copy.settings.help.button}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-400">
                {copy.settings.help.hint}
              </span>
            </Link>
          </div>

          <PrivacyDataSection
            isSignedIn={isSignedIn}
            onAccountDeleted={onAccountDeleted}
          />
        </div>
      )}
    </section>
  );
}
