"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import { SettingsPreferencesList } from "@/components/settings/SettingsPreferencesList";
import type { SettingsViewState } from "@/components/settings/settingsViewState";
import { RestoreFromCloudSection } from "@/components/settings/RestoreFromCloudSection";
import { ShareAppSection } from "@/components/settings/ShareAppSection";
import { TaxExportCard } from "@/components/settings/TaxExportCard";
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
import { isLeavingExportCompleted } from "@/lib/client/appNavigationHistory";
import type { IncomeCaptureKind } from "@/lib/export/incomeCapture";
import { hasSeasonExportDone } from "@/lib/settings/seasonExportState";
import type { FounderStatus, FounderTier } from "@/lib/founder/types";

interface SettingsScreenProps {
  industry: Industry | null;
  onIndustryChange: (industry: Industry) => void;
  viewState: SettingsViewState;
  onViewStateChange: (state: SettingsViewState) => void;
  onReplaceSettingsPage: (state: SettingsViewState) => void;
  onNavigateBack: () => void;
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
  onSnap1099?: (kind: IncomeCaptureKind) => void;
  requestSoftGoogleSheet?: boolean;
  onSoftGoogleSheetConsumed?: () => void;
  onSoftGuideDismiss?: () => void;
  skipSoftGoogleSheet?: boolean;
  exportBlockedTick?: number;
  seasonExportTick?: number;
  onboardingAha?: boolean;
  onSampleExportAhaComplete?: () => Promise<void>;
  onRestored?: () => void | Promise<void>;
}

export function SettingsScreen({
  industry,
  onIndustryChange,
  viewState,
  onViewStateChange,
  onReplaceSettingsPage,
  onNavigateBack,
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
  onSnap1099,
  requestSoftGoogleSheet = false,
  onSoftGoogleSheetConsumed,
  onSoftGuideDismiss,
  skipSoftGoogleSheet = false,
  exportBlockedTick = 0,
  seasonExportTick = 0,
  onboardingAha = false,
  onSampleExportAhaComplete,
  onRestored,
}: SettingsScreenProps) {
  const { copy } = useI18n();
  const prevViewStateRef = useRef(viewState);
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
  const [founderStatus, setFounderStatus] = useState<FounderStatus>("none");
  const [founderTier, setFounderTier] = useState<FounderTier | null>(null);
  const [founderNumber, setFounderNumber] = useState<number | null>(null);

  const seasonExportDone = useMemo(
    () => hasSeasonExportDone(currentSeason),
    [currentSeason, seasonExportTick],
  );

  useEffect(() => {
    setShowSampleReady(isSampleExportDone());
    setShowExportBlocked(isExportBlockedBannerActive());
  }, [exportBlockedTick]);

  useEffect(() => {
    const prev = prevViewStateRef.current;
    if (isLeavingExportCompleted(prev, viewState)) {
      markSampleExportDone();
      setShowSampleReady(true);
    }
    prevViewStateRef.current = viewState;
  }, [viewState]);

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
    if (!isSignedIn || !authHydrated) {
      setFounderStatus("none");
      setFounderTier(null);
      setFounderNumber(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await apiFetch("/api/founder/program");
        if (!res.ok || cancelled) return;

        const program = (await res.json()) as {
          user: {
            founderStatus: FounderStatus;
            founderTier: FounderTier | null;
            founderNumber: number | null;
          } | null;
        };
        if (cancelled) return;

        setFounderStatus(program.user?.founderStatus ?? "none");
        setFounderTier(program.user?.founderTier ?? null);
        setFounderNumber(program.user?.founderNumber ?? null);
      } catch {
        if (!cancelled) {
          setFounderStatus("none");
          setFounderTier(null);
          setFounderNumber(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, authHydrated]);

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

  const goToMain = useCallback(() => {
    onNavigateBack();
  }, [onNavigateBack]);

  const handleHeaderBack = () => {
    onNavigateBack();
  };

  const handleExportRequest = () => {
    if (!isSignedIn) {
      onViewStateChange("sample-export");
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
      onReplaceSettingsPage("export-completed");
    } finally {
      setSampleDownloading(false);
    }
  };

  const handleViewStatus = () => {
    onNavigateBack();
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
    <SettingsPageShell variant="main">
    <div className="flex h-full flex-col">
      <SettingsHeader onBack={handleHeaderBack} title={copy.settings.title} />

      <div className="flex-1 overflow-y-auto p-6">
        <SettingsAccountBlock
          googleUser={googleUser}
          seasonPaid={seasonPaid}
          seasonLabel={currentSeason}
          authHydrated={authHydrated}
          founderStatus={founderStatus}
          founderTier={founderTier}
          founderNumber={founderNumber}
          onSignIn={() => {
            clearError();
            setGoogleSheet("soft");
          }}
        />

        <TaxOverviewPanel {...taxStats} />

        <TaxExportCard
          currentSeason={currentSeason}
          isSignedIn={isSignedIn}
          seasonPaid={seasonPaid}
          hasSeasonExportDone={seasonExportDone}
          exportBusy={exportBusy}
          exportEmptyTip={exportEmptyTip}
          exportEmptyTipKey={exportEmptyTipKey}
          onExportEmptyTipDismiss={onExportEmptyTipDismiss}
          onRequestExport={handleExportRequest}
          onSnap1099={onSnap1099}
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

        <SettingsPreferencesList
          industry={industry}
          onNavigate={onViewStateChange}
        />

        <ShareAppSection />

        <RestoreFromCloudSection onRestored={onRestored} />

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
    </SettingsPageShell>
  );
}
