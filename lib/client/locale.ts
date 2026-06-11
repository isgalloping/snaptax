import { locales, defaultLocale, type Locale } from "@/i18n/config";

const LOCALE_COOKIE = "NEXT_LOCALE";

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const tag of langs) {
    const base = tag.split("-")[0]?.toLowerCase();
    if (base && (locales as readonly string[]).includes(base)) {
      return base as Locale;
    }
  }
  return defaultLocale;
}

export function ensureLocaleCookie(): Locale {
  const existing = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${LOCALE_COOKIE}=`))
    ?.split("=")[1];
  if (existing && (locales as readonly string[]).includes(existing)) {
    return existing as Locale;
  }
  const detected = detectBrowserLocale();
  document.cookie = `${LOCALE_COOKIE}=${detected};path=/;max-age=31536000;SameSite=Lax`;
  return detected;
}
