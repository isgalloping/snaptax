"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { SettingsSubPageShell } from "@/components/settings/SettingsSubPageShell";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

interface LanguageSubPageProps {
  onBack: () => void;
}

export function LanguageSubPage({ onBack }: LanguageSubPageProps) {
  const { locale, setLocale, copy } = useI18n();

  const labels: Record<Locale, string> = {
    "en-US": copy.settings.language.english,
    "fr-FR": copy.settings.language.french,
    "de-DE": copy.settings.language.german,
  };

  return (
    <SettingsSubPageShell title={copy.settings.language.title} onBack={onBack}>
      <ul className="space-y-2">
        {SUPPORTED_LOCALES.map((item) => {
          const selected = locale === item;
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => setLocale(item)}
                className={`flex min-h-14 w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-transform active:scale-[0.99] ${
                  selected
                    ? "border-yellow-500 bg-yellow-950/40"
                    : "border-zinc-600 bg-zinc-800"
                }`}
              >
                <span className="text-sm font-bold text-white">{labels[item]}</span>
                {selected && (
                  <span className="text-lg font-black text-green-400" aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </SettingsSubPageShell>
  );
}
