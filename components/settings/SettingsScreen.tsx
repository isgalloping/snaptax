"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Industry } from "@/lib/types";
import type { GoogleUser } from "@/lib/client/authStorage";
import type { GoogleAuthResponse } from "@/lib/client/authApi";
import { saveIndustry } from "@/lib/client/authStorage";
import { apiFetch } from "@/lib/client/ghostClient";
import { downloadOnboardingSampleCsv } from "@/lib/export/downloadOnboardingSampleCsv";
import { ensureOnboardingDemoDone } from "@/lib/onboarding/demoReceipt";
import {
  GOOGLE_SOFT_DISMISSED_KEY,
  readOnboardFlag,
  SETTINGS_VISITED_KEY,
  writeOnboardFlag,
} from "@/lib/onboarding/onboardingStorage";
import { GoogleSignInSheet, type GoogleSignInMode } from "@/components/auth/GoogleSignInSheet";
import { useI18n } from "@/components/i18n/I18nProvider";
import { ExportCompletedPage } from "@/components/settings/export/ExportCompletedPage";
import { SampleExportPage } from "@/components/settings/export/SampleExportPage";
import { ExportStatusBanner } from "@/components/settings/ExportStatusBanner";
import { SettingsAccountBlock } from "@/components/settings/SettingsAccountBlock";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsPreferencesList } from "@/components/settings/SettingsPreferencesList";
import type { SettingsViewState } from "@/components/settings/settingsViewState";
import { ShareAppSection } from "@/components/settings/ShareAppSection";
import { TaxExportSection } from "@/components/settings/TaxExportSection";
import {
  TaxOverviewPanel,
  type SettingsTaxStats,
} from "@/components/settings/TaxOverviewPanel";
import { IndustrySubPage } from "@/components/settings/subpages/IndustrySubPage";
import { LanguageSubPage } from "@/components/settings/subpages/LanguageSubPage";
import { NotificationsSubPage } from "@/components/settings/subpages/NotificationsSubPage";
import { PrivacyCenterSubPage } from "@/components/settings/subpages/PrivacyCenterSubPage";
import { isSignOutOfflineError } from "@/lib/client/signOutFlow";
import {
  dismissExportBlockedBanner,
  isExportBlockedBannerActive,
  isSampleExportDone,
  markSampleExportDone,
} from "@/lib/settings/exportSampleState";

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
  taxStats: SettingsTaxStats;
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
  exportBlockedTick?: number;
  onboardingAha?: boolean;
  onSampleExportAhaComplete?: () => Promise<void>;
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
  taxStats,
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
  exportBlockedTick = 0,
  onboardingAha = false,
  onSampleExportAhaComplete,
}: SettingsScreenProps) {
  const { copy } = useI18n();
  const [viewState, setViewState] = useState<SettingsViewState>("main");
  const [googleSheet, setGoogleSheet] = useState<GoogleSignInMode | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine,
  );
  const [sampleDownloading, setSampleDownloading] = useState(false);
  const [showSampleReady, setShowSampleReady] = useState(false);
  const [showExportBlocked, setShowExportBlocked] = useState(false);
  const firstVisitHandled = useRef(false);

  useEffect(() => {
    setShowSampleReady(isSampleExportDone());
    setShowExportBlocked(isExportBlockedBannerActive());
  }, [exportBlockedTick]);

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

  const goToMain = useCallback(() => setViewState("main"), []);

  const handleHeaderBack = () => {
    if (viewState === "main") {
      onBack();
      return;
    }
    if (viewState === "export-completed") {
      markSampleExportDone();
      setShowSampleReady(true);
      setViewState("main");
      return;
    }
    setViewState("main");
  };

  const handleExportRequest = () => {
    if (!isSignedIn) {
      setViewState("sample-export");
      return;
    }
    onRequestExport();
  };

  const handleSampleDownload = async () => {
    setSampleDownloading(true);
    try {
      const demo = await ensureOnboardingDemoDone();
      downloadOnboardingSampleCsv(demo);
      if (onboardingAha) {
        await onSampleExportAhaComplete?.();
      }
      setViewState("export-completed");
    } finally {
      setSampleDownloading(false);
    }
  };

  const handleViewStatus = () => {
    markSampleExportDone();
    setShowSampleReady(true);
    setViewState("main");
  };

  const handleDownloadAgain = async () => {
    const demo = await ensureOnboardingDemoDone();
    downloadOnboardingSampleCsv(demo);
  };

  const handleDismissExportBlocked = () => {
    dismissExportBlockedBanner();
    setShowExportBlocked(false);
  };

  const showRedBanner = isSignedIn && !seasonPaid && showExportBlocked;
  const showGreenBanner = !isSignedIn && showSampleReady && !showRedBanner;

  if (viewState === "language") {
    return (
      <>
        <LanguageSubPage onBack={goToMain} />
        {googleSheet && (
          <GoogleSignInSheet
            mode={googleSheet}
            onClose={() => setGoogleSheet(null)}
            onSoftDismiss={googleSheet === "soft" ? handleSoftDismiss : undefined}
            onUserSignedIn={handleUserSignedIn}
            onSuccess={handleGoogleSuccess}
            onFailure={(msg) => setErrorMessage(msg)}
          />
        )}
      </>
    );
  }

  if (viewState === "industry") {
    return (
      <>
        <IndustrySubPage
          industry={industry}
          onIndustryChange={(value) => void handleIndustryChange(value)}
          onBack={goToMain}
        />
        {googleSheet && (
          <GoogleSignInSheet
            mode={googleSheet}
            onClose={() => setGoogleSheet(null)}
            onSoftDismiss={googleSheet === "soft" ? handleSoftDismiss : undefined}
            onUserSignedIn={handleUserSignedIn}
            onSuccess={handleGoogleSuccess}
            onFailure={(msg) => setErrorMessage(msg)}
          />
        )}
      </>
    );
  }

  if (viewState === "notifications") {
    return (
      <>
        <NotificationsSubPage onBack={goToMain} />
        {googleSheet && (
          <GoogleSignInSheet
            mode={googleSheet}
            onClose={() => setGoogleSheet(null)}
            onSoftDismiss={googleSheet === "soft" ? handleSoftDismiss : undefined}
            onUserSignedIn={handleUserSignedIn}
            onSuccess={handleGoogleSuccess}
            onFailure={(msg) => setErrorMessage(msg)}
          />
        )}
      </>
    );
  }

  if (viewState === "privacy-center") {
    return (
      <>
        <PrivacyCenterSubPage
          onBack={goToMain}
          isSignedIn={isSignedIn}
          onAccountDeleted={onAccountDeleted ?? onLocalDataCleared}
        />
        {googleSheet && (
          <GoogleSignInSheet
            mode={googleSheet}
            onClose={() => setGoogleSheet(null)}
            onSoftDismiss={googleSheet === "soft" ? handleSoftDismiss : undefined}
            onUserSignedIn={handleUserSignedIn}
            onSuccess={handleGoogleSuccess}
            onFailure={(msg) => setErrorMessage(msg)}
          />
        )}
      </>
    );
  }

  if (viewState === "sample-export") {
    return (
      <>
        <SampleExportPage
          onBack={goToMain}
          onDownload={() => void handleSampleDownload()}
          onContinueGoogle={() => {
            clearError();
            setGoogleSheet("hard-export");
          }}
          downloading={sampleDownloading}
        />
        {googleSheet && (
          <GoogleSignInSheet
            mode={googleSheet}
            onClose={() => setGoogleSheet(null)}
            onUserSignedIn={handleUserSignedIn}
            onSuccess={handleGoogleSuccess}
            onFailure={(msg) => setErrorMessage(msg)}
          />
        )}
      </>
    );
  }

  if (viewState === "export-completed") {
    return (
      <>
        <ExportCompletedPage onViewStatus={handleViewStatus} />
        {googleSheet && (
          <GoogleSignInSheet
            mode={googleSheet}
            onClose={() => setGoogleSheet(null)}
            onUserSignedIn={handleUserSignedIn}
            onSuccess={handleGoogleSuccess}
            onFailure={(msg) => setErrorMessage(msg)}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex h-full flex-col bg-black text-white">
      <SettingsHeader onBack={handleHeaderBack} title={copy.settings.title} />

      <div className="flex-1 overflow-y-auto p-6">
        <SettingsAccountBlock
          googleUser={googleUser}
          seasonPaid={seasonPaid}
          seasonLabel={currentSeason}
          authHydrated={authHydrated}
          onSignIn={() => {
            clearError();
            setGoogleSheet("soft");
          }}
        />

        <TaxOverviewPanel {...taxStats} />

        <TaxExportSection
          currentSeason={currentSeason}
          seasonPaid={seasonPaid}
          exportBusy={exportBusy}
          exportEmptyTip={exportEmptyTip}
          exportEmptyTipKey={exportEmptyTipKey}
          onExportEmptyTipDismiss={onExportEmptyTipDismiss}
          onRequestExport={handleExportRequest}
        />

        {showRedBanner && (
          <ExportStatusBanner
            variant="export-blocked"
            onDismiss={handleDismissExportBlocked}
          />
        )}
        {showGreenBanner && (
          <ExportStatusBanner
            variant="sample-ready"
            onDownloadAgain={() => void handleDownloadAgain()}
          />
        )}

        <ShareAppSection />

        <SettingsPreferencesList
          industry={industry}
          onNavigate={setViewState}
        />

        {isSignedIn && onSignOut && (
          <button
            type="button"
            onClick={() => {
              setSignOutError(null);
              setShowSignOutConfirm(true);
            }}
            className="mt-2 mb-8 w-full min-h-16 rounded-xl border-2 border-zinc-600 bg-zinc-900 py-3 text-sm font-black uppercase tracking-wider text-white transition-transform active:scale-95"
          >
            {accountCopy.signOut}
          </button>
        )}

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
