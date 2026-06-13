import { DE_DE_COPY } from "./locales/de-DE";
import { EN_US_COPY } from "./locales/en-US";
import { FR_FR_COPY } from "./locales/fr-FR";
import type { UserCopy } from "./types";

export type { UserCopy } from "./types";

export const DEFAULT_LOCALE = "en-US";
export const SUPPORTED_LOCALES = ["en-US", "fr-FR", "de-DE"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

const USER_COPY_BY_LOCALE: Record<Locale, UserCopy> = {
  "en-US": EN_US_COPY,
  "fr-FR": FR_FR_COPY,
  "de-DE": DE_DE_COPY,
};

export function isSupportedLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

function localeFromLanguageTag(tag: string): Locale | null {
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return null;

  const exact = SUPPORTED_LOCALES.find(
    (locale) => locale.toLowerCase() === normalized,
  );
  if (exact) return exact;

  const language = normalized.split("-")[0];
  if (language === "fr") return "fr-FR";
  if (language === "de") return "de-DE";
  if (language === "en") return "en-US";
  return null;
}

type LocaleCandidate = {
  tag: string;
  q: number;
  index: number;
};

export function pickLocale(
  input: string | readonly string[] | null | undefined,
): Locale {
  let candidates: LocaleCandidate[];

  if (typeof input === "string" || !input) {
    candidates = (input ?? "").split(",").map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag, q: Number.isFinite(q) ? q : 0, index };
    });
  } else {
    candidates = input.map((value, index) => ({ tag: value, q: 1, index }));
  }

  for (const candidate of candidates
    .filter((item) => item.tag && item.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)) {
    const locale = localeFromLanguageTag(candidate.tag);
    if (locale) return locale;
  }

  return DEFAULT_LOCALE;
}

export function getUserCopy(locale: Locale): UserCopy {
  return USER_COPY_BY_LOCALE[locale] ?? USER_COPY_BY_LOCALE[DEFAULT_LOCALE];
}

/** BCP 47 language tag for `<html lang>` (en | fr | de). */
export function htmlLangForLocale(locale: Locale): string {
  return locale.split("-")[0] ?? "en";
}
