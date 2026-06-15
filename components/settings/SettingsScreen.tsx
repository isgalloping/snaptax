"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Industry } from "@/lib/types";
import { INDUSTRIES } from "@/lib/types";
import type { GoogleUser } from "@/lib/client/authStorage";
import type { GoogleAuthResponse } from "@/lib/client/authApi";
import { saveIndustry } from "@/lib/client/authStorage";
import { apiFetch } from "@/lib/client/ghostClient";
import {
  GOOGLE_SOFT_DISMISSED_KEY,
  readOnboardFlag,
  SETTINGS_VISITED_KEY,
  writeOnboardFlag,
} from "@/lib/onboarding/onboardingStorage";
import { AccountStatusBlock } from "@/components/auth/AccountStatusBlock";
import { GoogleSignInSheet, type GoogleSignInMode } from "@/components/auth/GoogleSignInSheet";
import { useI18n } from "@/components/i18n/I18nProvider";
import { SyncInstructionsSheet } from "@/components/auth/SyncInstructionsSheet";
import { PrivacyDataSection } from "@/components/settings/PrivacyDataSection";
import {
  isSignOutOfflineError,
} from "@/lib/client/signOutFlow";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

interface SettingsScreenProps {
  industry: Industry | null;
  onIndustryChange: (industry: Industry) => void;
  onBack: () => void;
  onAccountDeleted?: () => void;
  /** @deprecated use onAccountDeleted */
  onLocalDataCleared?: () => void;
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  currentSeason: string;
  isSignedIn: boolean;
  onUserSignedIn?: (result: GoogleAuthResponse) => void;
  onPostLoginSync?: (taxRecalcQueued: number) => Promise<void>;
  onSignOut?: () => Promise<void>;
  onRequestExport: () => void;
  exportBusy?: boolean;
  exportError?: string | null;
  /** Open soft Google sheet immediately (e.g. from TaxHeader nudge). */
  requestSoftGoogleSheet?: boolean;
  onSoftGoogleSheetConsumed?: () => void;
  onSoftGuideDismiss?: () => void;
  /** Skip first-visit soft Google sheet (Aha onboarding path). */
  skipSoftGoogleSheet?: boolean;
}

export function SettingsScreen({
  industry,
  onIndustryChange,
  onBack,
  onAccountDeleted,
  onLocalDataCleared,
  googleUser,
  seasonPaid,
  currentSeason,
  isSignedIn,
  onUserSignedIn,
  onPostLoginSync,
  onSignOut,
  onRequestExport,
  exportBusy = false,
  exportError = null,
  requestSoftGoogleSheet = false,
  onSoftGoogleSheetConsumed,
  onSoftGuideDismiss,
  skipSoftGoogleSheet = false,
}: SettingsScreenProps) {
  const { locale, setLocale, copy } = useI18n();
  const [googleSheet, setGoogleSheet] = useState<GoogleSignInMode | null>(null);
  const [showSyncHelp, setShowSyncHelp] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAfterSignIn, setPendingAfterSignIn] = useState<"sync" | null>(null);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine,
  );
  const firstVisitHandled = useRef(false);

  useEffect(() => {
    const syncOnline = () =>
      setIsOnline(typeof navigator !== "undefined" && navigator.onLine);
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  useEffect(() => {
    if (firstVisitHandled.current) return;
    firstVisitHandled.current = true;

    const settingsVisited = readOnboardFlag(SETTINGS_VISITED_KEY);
    writeOnboardFlag(SETTINGS_VISITED_KEY);

    if (
      !skipSoftGoogleSheet &&
      !isSignedIn &&
      !settingsVisited &&
      !readOnboardFlag(GOOGLE_SOFT_DISMISSED_KEY)
    ) {
      const timer = window.setTimeout(() => setGoogleSheet("soft"), 300);
      return () => window.clearTimeout(timer);
    }
  }, [isSignedIn, skipSoftGoogleSheet]);

  useEffect(() => {
    if (!requestSoftGoogleSheet || isSignedIn || skipSoftGoogleSheet) return;
    const timer = window.setTimeout(() => {
      setGoogleSheet("soft");
      onSoftGoogleSheetConsumed?.();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [requestSoftGoogleSheet, isSignedIn, onSoftGoogleSheetConsumed, skipSoftGoogleSheet]);

  const handleSoftDismiss = () => {
    writeOnboardFlag(GOOGLE_SOFT_DISMISSED_KEY);
    onSoftGuideDismiss?.();
  };

  const clearError = () => setErrorMessage(null);
  const displayError = errorMessage ?? exportError ?? signOutError;
  const accountCopy = copy.settings.account;
  const offline = !isOnline;

  const handleSignOut = async () => {
    if (!onSignOut) return;
    setSigningOut(true);
    setSignOutError(null);
    try {
      await onSignOut();
      setShowSignOutConfirm(false);
    } catch (err) {
      if (isSignOutOfflineError(err)) {
        setSignOutError(accountCopy.signOutRequiresOnline);
      } else {
        setSignOutError(accountCopy.signOutFailed);
      }
    } finally {
      setSigningOut(false);
    }
  };

  const handleGoogleSuccess = async (result: { taxRecalcQueued: number }) => {
    await onPostLoginSync?.(result.taxRecalcQueued);
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
    saveIndustry(value);
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
    "fr-FR": copy.settings.language.french,
    "de-DE": copy.settings.language.german,
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
          onSignOut={
            isSignedIn
              ? () => {
                  setSignOutError(null);
                  setShowSignOutConfirm(true);
                }
              : undefined
          }
        />

        <section className="mb-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            {copy.settings.language.title}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {SUPPORTED_LOCALES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLocale(item)}
                aria-pressed={locale === item}
                className={`min-h-16 rounded-xl border-2 p-4 text-center text-sm font-bold transition-transform active:scale-95 ${
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

        <section className="mb-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            {copy.settings.help.title}
          </h2>
          <Link
            href="/help"
            className="block w-full min-h-16 rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4 text-left transition-transform active:scale-95"
          >
            <span className="text-sm font-bold text-white">
              {copy.settings.help.button}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-zinc-400">
              {copy.settings.help.hint}
            </span>
          </Link>
        </section>

        <PrivacyDataSection
          isSignedIn={isSignedIn}
          onAccountDeleted={onAccountDeleted ?? onLocalDataCleared}
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
          onSoftDismiss={googleSheet === "soft" ? handleSoftDismiss : undefined}
          onUserSignedIn={onUserSignedIn}
          onSuccess={handleGoogleSuccess}
          onFailure={(msg) => {
            setErrorMessage(msg);
          }}
        />
      )}

      {showSyncHelp && googleUser && (
        <SyncInstructionsSheet
          email={googleUser.email}
          onClose={() => setShowSyncHelp(false)}
        />
      )}

      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70">
          <div className="w-full rounded-t-3xl border-t-4 border-zinc-600 bg-zinc-900 p-6 pb-10">
            <p className="text-lg font-black uppercase tracking-wider text-white">
              {accountCopy.signOutTitle}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300">
              {accountCopy.signOutWarning}
            </p>
            {offline && (
              <p className="mt-4 text-sm font-bold text-yellow-400" role="alert">
                {accountCopy.signOutRequiresOnline}
              </p>
            )}
            {signOutError && (
              <p className="mt-4 text-sm font-bold text-red-500" role="alert">
                {signOutError}
              </p>
            )}
            <button
              type="button"
              disabled={signingOut || offline}
              onClick={() => void handleSignOut()}
              className="mt-6 w-full min-h-16 rounded-xl border-2 border-zinc-600 bg-zinc-800 py-4 text-lg font-black uppercase tracking-wider text-white transition-transform active:scale-95 disabled:opacity-60"
            >
              {signingOut ? accountCopy.signingOut : accountCopy.signOut}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSignOutConfirm(false);
                setSignOutError(null);
              }}
              className="mt-3 w-full min-h-16 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95"
            >
              {copy.settings.privacyData.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
