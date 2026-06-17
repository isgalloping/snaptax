"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Receipt } from "@/lib/types";
import { useAuthSession } from "@/lib/client/useAuthSession";
import {
  STARTUP_UNFILED_LIMIT,
  UI_RECEIPT_LIMIT,
} from "@/lib/client/receiptSync";
import { withFreshBudget, isSyncStuck } from "@/lib/client/receiptSyncBudget";
import { ensureTaxRegionCandidate } from "@/lib/client/taxRegion";
import { utcNow } from "@/lib/time/utc";
import {
  convertDemoReceiptAfterLogin,
  ensureConvertedDemoUploadReady,
} from "@/lib/onboarding/demoReceipt";
import {
  loadRecentUnfiledReceipts,
  loadTopByUpdatedAt,
  savePhoto,
  saveReceipt,
  sumUnfiledLocalTaxSavedIndexed,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import { sumDoneExpenses } from "@/lib/receipts/receiptStats";
import { OnboardingOrchestrator } from "@/components/onboarding/OnboardingOrchestrator";
import { OnboardingSkipButton } from "@/components/onboarding/OnboardingSkipButton";
import { SnapFocusRing } from "@/components/onboarding/SnapFocusRing";
import { SnapTooltip } from "@/components/onboarding/SnapTooltip";
import { useOnboardingFlow } from "@/components/onboarding/useOnboardingFlow";
import { visibleReceiptsForOnboarding } from "@/lib/onboarding/onboardingReceipts";
import { TaxHeader } from "./TaxHeader";
import { TrustBar } from "./TrustBar";
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
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [taxSaved, setTaxSaved] = useState<number | null>(null);
  const [syncStuckIds, setSyncStuckIds] = useState<Set<string>>(() => new Set());

  const refreshListFromLocal = useCallback(async () => {
    const visible = await loadTopByUpdatedAt(UI_RECEIPT_LIMIT);
    setReceipts(visible);
    setSyncStuckIds(stuckIdsFromReceipts(visible));
    setTaxSaved(await sumUnfiledLocalTaxSavedIndexed());
    return visible;
  }, []);

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
      setTaxSaved(await sumUnfiledLocalTaxSavedIndexed());

      deferAfterPaint(async () => {
        if (cancelled) return;
        await refreshListFromLocal();
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [initializeOnboarding, refreshListFromLocal]);

  const handleCapture = useCallback(async (file: File) => {
    const id = crypto.randomUUID();
    const snapAt = utcNow();
    const processingReceipt: StoredReceipt = withFreshBudget({
      id,
      status: "processing",
      merchant: "Scanning",
      timestamp: snapAt,
      updatedAt: snapAt,
      pendingUpload: true,
    });

    await savePhoto(id, file);
    await saveReceipt(processingReceipt);
    await refreshListFromLocal();
  }, [refreshListFromLocal]);

  const noopAsync = useCallback(async () => {}, []);
  const noopBatchShot = useCallback(async () => crypto.randomUUID(), []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-black font-sans text-white select-none">
      <TaxHeader
        taxSaved={taxSaved}
        displayTaxSaved={displayTaxSaved}
        totalExpenses={sumDoneExpenses(displayReceipts)}
        receiptCount={displayReceipts.length}
        animating={taxAnimating}
        ahaCoachActive={ahaCoachActive}
        onAhaCoachDismiss={dismissAhaCoach}
        onSettingsClick={() => {}}
        showSettings={false}
      />

      <TrustBar />

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

      <div className="flex min-h-0 flex-1 flex-col">
        <ReceiptList
          receipts={displayReceipts}
          syncStuckIds={syncStuckIds}
          ahaCoachActive={ahaCoachActive}
          onAhaCoachDismiss={dismissAhaCoach}
          onSelect={() => {}}
          onResnap={() => {}}
          onRetrySync={() => {}}
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
