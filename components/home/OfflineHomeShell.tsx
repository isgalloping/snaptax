"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Receipt } from "@/lib/types";
import type { ReceiptListFilter } from "@/lib/receipts/receiptBucket";
import { useAuthSession } from "@/lib/client/useAuthSession";
import {
  DUPLICATE_HIGHLIGHT_MS,
  duplicateNoticeCopy,
  scrollReceiptIntoView,
} from "@/lib/client/duplicateReceiptNotice";
import { prepareReceiptCapture } from "@/lib/client/prepareReceiptCapture";
import {
  STARTUP_UNFILED_LIMIT,
  UI_RECEIPT_LIMIT,
} from "@/lib/client/receiptSync";
import { isSyncStuck } from "@/lib/client/receiptSyncBudget";
import { ensureTaxRegionCandidate } from "@/lib/client/taxRegion";
import {
  convertDemoReceiptAfterLogin,
  ensureConvertedDemoUploadReady,
} from "@/lib/onboarding/demoReceipt";
import {
  loadRecentUnfiledReceipts,
  loadTopByUpdatedAt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import { readCurrentSeasonSummary } from "@/lib/storage/receiptSummary";
import type { ReceiptSeasonSummary } from "@/lib/storage/receiptSummaryTypes";
import { resolveHeaderTaxSaved } from "@/lib/client/resolveHeaderTaxSaved";
import { sumDoneExpenses } from "@/lib/receipts/receiptStats";
import { OnboardingOrchestrator } from "@/components/onboarding/OnboardingOrchestrator";
import { OnboardingSkipButton } from "@/components/onboarding/OnboardingSkipButton";
import { SnapFocusRing } from "@/components/onboarding/SnapFocusRing";
import { SnapTooltip } from "@/components/onboarding/SnapTooltip";
import { useOnboardingFlow } from "@/components/onboarding/useOnboardingFlow";
import { visibleReceiptsForOnboarding } from "@/lib/onboarding/onboardingReceipts";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { TaxHeader } from "./TaxHeader";
import { InlinePrivacyNote } from "./InlinePrivacyNote";
import { SnapButton } from "./SnapButton";
import { ReceiptList } from "./ReceiptList";
import { logStartupMarks } from "@/lib/landing/startupMetrics";

function deferAfterPaint(fn: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

function stuckIdsFromReceipts(receipts: StoredReceipt[]): Set<string> {
  return new Set(receipts.filter(isSyncStuck).map((r) => r.id));
}

export function OfflineHomeShell() {
  const auth = useAuthSession();
  const copy = useUserCopy();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [taxSaved, setTaxSaved] = useState<number | null>(null);
  const [seasonSummary, setSeasonSummary] = useState<ReceiptSeasonSummary | null>(
    null,
  );
  const [syncStuckIds, setSyncStuckIds] = useState<Set<string>>(() => new Set());
  const [listFilter, setListFilter] = useState<ReceiptListFilter>("all");
  const [receiptNotice, setReceiptNotice] = useState<string | null>(null);
  const [highlightReceiptId, setHighlightReceiptId] = useState<string | null>(
    null,
  );

  const refreshTaxAndSummary = useCallback(async () => {
    const summary = await readCurrentSeasonSummary();
    setSeasonSummary(summary);
    setTaxSaved(summary.totalTaxSaved);
  }, []);

  const refreshListFromLocal = useCallback(async () => {
    const visible = await loadTopByUpdatedAt(UI_RECEIPT_LIMIT);
    setReceipts(visible);
    setSyncStuckIds(stuckIdsFromReceipts(visible));
    await refreshTaxAndSummary();
    return visible;
  }, [refreshTaxAndSummary]);

  const handleOnboardingPostLogin = useCallback(async (_taxRecalcQueued: number) => {
    await convertDemoReceiptAfterLogin();
    await ensureConvertedDemoUploadReady();
    await refreshListFromLocal();
  }, [refreshListFromLocal]);

  const handleOnboardingRefreshReceipts = useCallback(async () => {
    await refreshListFromLocal();
  }, [refreshListFromLocal]);

  const onboarding = useOnboardingFlow({
    receipts,
    taxSaved,
    onRefreshReceipts: handleOnboardingRefreshReceipts,
    onGoogleSignIn: auth.signInWithGoogle,
    onGooglePostLogin: handleOnboardingPostLogin,
  });

  const {
    initializeOnboarding,
    displayTaxSaved,
    taxAnimating,
    ahaCoachActive,
    dismissAhaCoach,
    handleSnapIntent,
    skipOnboardingFlow,
    orchestratorProps,
    onboardingStatus,
    onboardingInFlow,
  } = onboarding;

  const displayReceipts = useMemo(
    () => visibleReceiptsForOnboarding(receipts, onboardingStatus),
    [receipts, onboardingStatus],
  );

  const headerTaxSaved = useMemo(
    () =>
      resolveHeaderTaxSaved({
        displayTaxSaved,
        seasonTotalTaxSaved: seasonSummary?.totalTaxSaved,
        taxSavedFallback: taxSaved,
      }),
    [displayTaxSaved, seasonSummary, taxSaved],
  );

  useEffect(() => {
    performance.mark("startup:offline-home");
    logStartupMarks();

    let cancelled = false;

    void (async () => {
      ensureTaxRegionCandidate();
      await initializeOnboarding();
      if (cancelled) return;

      const hot = await loadRecentUnfiledReceipts(STARTUP_UNFILED_LIMIT);
      if (cancelled) return;

      setSyncStuckIds(stuckIdsFromReceipts(hot));
      setReceipts(hot);
      await refreshTaxAndSummary();

      deferAfterPaint(async () => {
        if (cancelled) return;
        await refreshListFromLocal();
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [initializeOnboarding, refreshListFromLocal, refreshTaxAndSummary]);

  useEffect(() => {
    if (!receiptNotice) return;
    const timer = window.setTimeout(() => setReceiptNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [receiptNotice]);

  const showDuplicateReceiptNotice = useCallback(
    (existingReceiptId: string, matchType: "exact" | "similar") => {
      setReceiptNotice(
        duplicateNoticeCopy(copy.home.receiptList, matchType),
      );
      setHighlightReceiptId(existingReceiptId);
      window.setTimeout(() => setHighlightReceiptId(null), DUPLICATE_HIGHLIGHT_MS);
      requestAnimationFrame(() => scrollReceiptIntoView(existingReceiptId));
    },
    [copy.home.receiptList],
  );

  const handleCapture = useCallback(
    async (file: File) => {
      const result = await prepareReceiptCapture(file);
      if (result.kind === "duplicate") {
        showDuplicateReceiptNotice(result.existingReceiptId, "exact");
        return;
      }
      await refreshListFromLocal();
    },
    [refreshListFromLocal, showDuplicateReceiptNotice],
  );

  const noopAsync = useCallback(async () => {}, []);
  const noopBatchShot = useCallback(async () => null, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-black font-sans text-white select-none">
      <TaxHeader
        taxSaved={headerTaxSaved}
        totalExpenses={sumDoneExpenses(displayReceipts)}
        receiptCount={displayReceipts.length}
        animating={taxAnimating}
        ahaCoachActive={ahaCoachActive}
        onAhaCoachDismiss={dismissAhaCoach}
        onSettingsClick={() => {}}
        showSettings={false}
      />

      <div className="relative shrink-0 px-4 pt-0 pb-1.5">
        {onboardingStatus === "stage_1" && <SnapTooltip />}
        <div className="relative w-full">
          {onboardingStatus === "stage_1" && <SnapFocusRing />}
          <SnapButton
            onCapture={handleCapture}
            onBatchShot={noopBatchShot}
            onBatchDone={noopAsync}
            onBatchClose={noopAsync}
            onReviewDelete={noopAsync}
            syncDisabled
            onSnapIntent={handleSnapIntent}
          />
        </div>
      </div>

      <InlinePrivacyNote />

      {receiptNotice && (
        <p
          className="mx-4 mb-2 rounded-xl border-2 border-yellow-500 bg-yellow-950 px-4 py-3 text-center text-sm font-bold text-yellow-400"
          role="status"
        >
          {receiptNotice}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <ReceiptList
          receipts={displayReceipts}
          syncStuckIds={syncStuckIds}
          highlightReceiptId={highlightReceiptId}
          filter={listFilter}
          onFilterChange={setListFilter}
          ahaCoachActive={ahaCoachActive}
          onAhaCoachDismiss={dismissAhaCoach}
          onSelect={() => {}}
          onResnap={() => {}}
          onRetrySync={() => {}}
          onDelete={() => {}}
          syncDisabled
        />
      </div>

      {orchestratorProps && (
        <OnboardingOrchestrator {...orchestratorProps} />
      )}

      {onboardingInFlow && (
        <OnboardingSkipButton onSkip={skipOnboardingFlow} />
      )}
    </div>
  );
}
