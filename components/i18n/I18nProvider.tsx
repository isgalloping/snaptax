"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  getUserCopy,
  htmlLangForLocale,
  isSupportedLocale,
  pickLocale,
  type Locale,
  type UserCopy,
} from "@/lib/i18n";

const STORAGE_KEY = "snap1099_locale";

type I18nContextValue = {
  locale: Locale;
  copy: UserCopy;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const localeResolvedRef = useRef(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const resolved: Locale =
      stored && isSupportedLocale(stored)
        ? stored
        : pickLocale(window.navigator.languages);
    setLocaleState(resolved);
    document.documentElement.lang = htmlLangForLocale(resolved);
    localeResolvedRef.current = true;
  }, []);

  useEffect(() => {
    if (!localeResolvedRef.current) return;
    document.documentElement.lang = htmlLangForLocale(locale);
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      copy: getUserCopy(locale),
      setLocale: setLocaleState,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}

export function useUserCopy(): UserCopy {
  return useI18n().copy;
}

