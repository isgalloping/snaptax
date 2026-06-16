"use client";

import { useEffect, useRef, useState } from "react";
import type { Industry } from "@/lib/types";
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
import { SettingsPreferencesSection } from "@/components/settings/SettingsPreferencesSection";
import { ShareAppSection } from "@/components/settings/ShareAppSection";
import { TaxExportSection } from "@/components/settings/TaxExportSection";
import { isSignOutOfflineError } from "@/lib/client/signOutFlow";

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
  authHydrated?: boolean;
  onUserSignedIn?: (result: GoogleAuthResponse) => void;
  onPostLoginSync?: (taxRecalcQueued: number) => Promise<void>;
  onSignOut?: () => Promise<void>;
  onRequestExport: () => void;
  exportBusy?: boolean;
  exportError?: string | null;
  exportEmptyTip?: string | null;
  exportEmptyTipKey?: number;
  onExportEmptyTipDismiss?: () => void;
  requestSoftGoogleSheet?: boolean;
  onSoftGoogleSheetConsumed?: () => void;
  onSoftGuideDismiss?: () => void;
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
  authHydrated = true,
  onUserSignedIn,
  onPostLoginSync,
  onSignOut,
  onRequestExport,
  exportBusy = false,
  exportError = null,
  exportEmptyTip = null,
  exportEmptyTipKey = 0,
  onExportEmptyTipDismiss,
  requestSoftGoogleSheet = false,
  onSoftGoogleSheetConsumed,
  onSoftGuideDismiss,
  skipSoftGoogleSheet = false,
}: SettingsScreenProps) {
  const { copy } = useI18n();
  const [googleSheet, setGoogleSheet] = useState<GoogleSignInMode | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    const closingSoftSheet = googleSheet === "soft";
    if (!closingSoftSheet) {
      setGoogleSheet(null);
    }
    await onPostLoginSync?.(result.taxRecalcQueued);
  };

  const handleUserSignedIn = (result: GoogleAuthResponse) => {
    onUserSignedIn?.(result);
    if (googleSheet === "soft") {
      setGoogleSheet(null);
    }
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
          authHydrated={authHydrated}
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

        <TaxExportSection
          currentSeason={currentSeason}
          seasonPaid={seasonPaid}
          exportBusy={exportBusy}
          exportEmptyTip={exportEmptyTip}
          exportEmptyTipKey={exportEmptyTipKey}
          onExportEmptyTipDismiss={onExportEmptyTipDismiss}
          onRequestExport={onRequestExport}
        />

        <ShareAppSection />

        <SettingsPreferencesSection
          industry={industry}
          onIndustryChange={(value) => void handleIndustryChange(value)}
          isSignedIn={isSignedIn}
          onAccountDeleted={onAccountDeleted ?? onLocalDataCleared}
        />

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
          }}
          onSoftDismiss={googleSheet === "soft" ? handleSoftDismiss : undefined}
          onUserSignedIn={handleUserSignedIn}
          onSuccess={handleGoogleSuccess}
          onFailure={(msg) => {
            setErrorMessage(msg);
          }}
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
