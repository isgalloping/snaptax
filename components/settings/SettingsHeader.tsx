"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

interface SettingsHeaderProps {
  onBack: () => void;
  title: string;
  showLocaleSwitcher?: boolean;
}

const LOCALE_SEGMENT_LABELS: Record<Locale, "localeEn" | "localeFr" | "localeDe"> = {
  "en-US": "localeEn",
  "fr-FR": "localeFr",
  "de-DE": "localeDe",
};

export function SettingsHeader({
  onBack,
  title,
  showLocaleSwitcher = true,
}: SettingsHeaderProps) {
  const { locale, setLocale, copy } = useI18n();
  const headerCopy = copy.settings.header;

  return (
    <header className="flex shrink-0 items-center gap-2 border-b-4 border-yellow-500 bg-black/50 p-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-16 min-w-16 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 px-3 text-sm font-black uppercase tracking-wider transition-transform active:scale-95"
      >
        {copy.settings.back}
      </button>
      <h1 className="min-w-0 flex-1 truncate text-lg font-black uppercase tracking-wider">
        {title}
      </h1>
      {showLocaleSwitcher && (
        <div
          className="flex shrink-0 rounded-lg border border-zinc-600 bg-zinc-800 p-0.5"
          role="group"
          aria-label={copy.settings.language.title}
        >
          {SUPPORTED_LOCALES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLocale(item)}
              aria-pressed={locale === item}
              className={`min-h-10 min-w-10 rounded-md px-2 text-xs font-black transition-transform active:scale-95 ${
                locale === item
                  ? "bg-yellow-500 text-black"
                  : "text-zinc-400"
              }`}
            >
              {headerCopy[LOCALE_SEGMENT_LABELS[item]]}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
