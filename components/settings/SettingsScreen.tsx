"use client";

import { useState } from "react";
import type { Industry } from "@/lib/types";
import { INDUSTRIES } from "@/lib/types";
import type { GoogleUser } from "@/lib/client/authStorage";
import { apiFetch } from "@/lib/client/ghostClient";
import { AccountStatusBlock } from "@/components/auth/AccountStatusBlock";
import { GoogleSignInSheet, type GoogleSignInMode } from "@/components/auth/GoogleSignInSheet";
import { useI18n } from "@/components/i18n/I18nProvider";
import { SyncInstructionsSheet } from "@/components/auth/SyncInstructionsSheet";
import { PrivacyDataSection } from "@/components/settings/PrivacyDataSection";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

interface SettingsScreenProps {
  industry: Industry | null;
  onIndustryChange: (industry: Industry) => void;
  onBack: () => void;
  onLocalDataCleared?: () => void;
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  currentSeason: string;
  isSignedIn: boolean;
  onSignInWithGoogle: () => Promise<{ user: GoogleUser; taxRecalcQueued: number }>;
  onPostLoginSync?: (taxRecalcQueued: number) => Promise<void>;
  onRequestExport: () => void;
  exportBusy?: boolean;
  exportError?: string | null;
}

export function SettingsScreen({
  industry,
  onIndustryChange,
  onBack,
  onLocalDataCleared,
  googleUser,
  seasonPaid,
  currentSeason,
  isSignedIn,
  onSignInWithGoogle,
  onPostLoginSync,
  onRequestExport,
  exportBusy = false,
  exportError = null,
}: SettingsScreenProps) {
  const { locale, setLocale, copy } = useI18n();
  const [googleSheet, setGoogleSheet] = useState<GoogleSignInMode | null>(null);
  const [showSyncHelp, setShowSyncHelp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAfterSignIn, setPendingAfterSignIn] = useState<"sync" | null>(null);

  const clearError = () => setErrorMessage(null);
  const displayError = errorMessage ?? exportError;

  const handleGoogleSuccess = async () => {
    const { taxRecalcQueued } = await onSignInWithGoogle();
    await onPostLoginSync?.(taxRecalcQueued);
    setGoogleSheet(null);
    if (pendingAfterSignIn === "sync") {
      setShowSyncHelp(true);
      setPendingAfterSignIn(null);
    }
  };

  const requireGoogle = (mode: GoogleSignInMode, after: "sync") => {
    clearError();
    if (googleUser) {
      setShowSyncHelp(true);
      return;
    }
    setPendingAfterSignIn(after);
    setGoogleSheet(mode);
  };

  const handleViewAllDevices = () => {
    requireGoogle("hard-sync", "sync");
  };

  const handleIndustryChange = async (value: Industry) => {
    onIndustryChange(value);
    if (isSignedIn && navigator.onLine) {
      await apiFetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: value }),
      }).catch(() => {});
    }
  };

  const languageLabels: Record<Locale, string> = {
    "en-US": copy.settings.language.english,
    "zh-CN": copy.settings.language.chinese,
  };

  return (
    <div className="flex h-full flex-col bg-black text-white">
      <header className="flex items-center border-b-4 border-yellow-500 bg-zinc-900 p-4">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-16 min-w-16 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider transition-transform active:scale-95"
        >
          {copy.settings.back}
        </button>
        <h1 className="ml-4 text-lg font-black uppercase tracking-wider">
          {copy.settings.title}
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <AccountStatusBlock
          googleUser={googleUser}
          seasonPaid={seasonPaid}
          seasonLabel={currentSeason}
          onSignIn={() => {
            clearError();
            setGoogleSheet("soft");
          }}
        />

        <section className="mb-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            {copy.settings.language.title}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {SUPPORTED_LOCALES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLocale(item)}
                className={`min-h-16 rounded-xl border-2 p-4 text-left text-sm font-bold transition-transform active:scale-95 ${
                  locale === item
                    ? "border-yellow-500 bg-yellow-950 text-yellow-400"
                    : "border-zinc-600 bg-zinc-800 text-white"
                }`}
              >
                {languageLabels[item]}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            {copy.settings.industry.title}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {INDUSTRIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void handleIndustryChange(item.id)}
                className={`min-h-16 rounded-xl border-2 p-4 text-left text-sm font-bold transition-transform active:scale-95 ${
                  industry === item.id
                    ? "border-yellow-500 bg-yellow-950 text-yellow-400"
                    : "border-zinc-600 bg-zinc-800 text-white"
                }`}
              >
                {copy.settings.industry.labels[item.id]}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            {copy.settings.multiDevice.title}
          </h2>
          <button
            type="button"
            onClick={handleViewAllDevices}
            className="w-full min-h-16 rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4 text-left text-sm font-bold text-white transition-transform active:scale-95"
          >
            {copy.settings.multiDevice.button}
          </button>
        </section>

        <PrivacyDataSection
          isSignedIn={isSignedIn}
          onLocalDataCleared={onLocalDataCleared}
        />

        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            {copy.settings.export.title}
          </h2>
          <button
            type="button"
            disabled={exportBusy}
            onClick={onRequestExport}
            className="w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
          >
            {exportBusy
              ? copy.settings.export.exporting
              : seasonPaid
                ? copy.settings.export.buttonPaid
                : copy.settings.export.button}
          </button>
        </section>

        {displayError && (
          <p className="mt-4 text-center text-sm font-bold text-red-500" role="alert">
            {displayError}
          </p>
        )}
      </div>

      {googleSheet && (
        <GoogleSignInSheet
          mode={googleSheet}
          onClose={() => {
            setGoogleSheet(null);
            setPendingAfterSignIn(null);
          }}
          onSuccess={handleGoogleSuccess}
          onFailure={(msg) => {
            setErrorMessage(msg);
            setGoogleSheet(null);
            setPendingAfterSignIn(null);
          }}
        />
      )}

      {showSyncHelp && googleUser && (
        <SyncInstructionsSheet
          email={googleUser.email}
          onClose={() => setShowSyncHelp(false)}
        />
      )}
    </div>
  );
}
