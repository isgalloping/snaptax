"use client";

import { useCallback, useMemo, useState } from "react";
import type { Receipt } from "@/lib/types";
import { resolveSnapIntent } from "@/components/onboarding/OnboardingOrchestrator";
import { ONBOARDING_DEMO_TAX_SAVED } from "@/lib/onboarding/demoReceipt";
import {
  ensureOnboardingInitialized,
  isOnboardingActive,
  setOnboardingStatus,
  type OnboardingStatus,
} from "@/lib/onboarding/onboardingState";

interface UseOnboardingFlowOptions {
  receipts: Receipt[];
  taxSaved: number | null;
  onRefreshReceipts: () => Promise<void>;
  onGoogleSignIn: () => Promise<{ taxRecalcQueued: number }>;
  onGooglePostLogin: (taxRecalcQueued: number) => Promise<void>;
}

export function useOnboardingFlow({
  receipts,
  taxSaved,
  onRefreshReceipts,
  onGoogleSignIn,
  onGooglePostLogin,
}: UseOnboardingFlowOptions) {
  const [onboardingStatus, setOnboardingStatusState] =
    useState<OnboardingStatus | null>(null);
  const [taxDisplayOverride, setTaxDisplayOverride] = useState<number | null>(
    null,
  );
  const [taxAnimating, setTaxAnimating] = useState(false);

  const initializeOnboarding = useCallback(async () => {
    const status = await ensureOnboardingInitialized();
    setOnboardingStatusState(status);
    return status;
  }, []);

  const onboardingInFlow = useMemo(
    () =>
      onboardingStatus != null &&
      (isOnboardingActive(onboardingStatus) ||
        onboardingStatus === "stage_4"),
    [onboardingStatus],
  );

  const skipSoftGoogleSheet = useMemo(
    () => onboardingStatus != null && onboardingStatus !== "completed",
    [onboardingStatus],
  );

  const displayTaxSaved = useMemo(() => {
    if (taxDisplayOverride != null) return taxDisplayOverride;
    if (onboardingStatus === "stage_1") return 0;
    if (onboardingStatus === "stage_4") {
      const demo = receipts.find(
        (r) => r.isOnboardingDemo && r.status === "done",
      );
      if (demo?.taxAmount != null) return demo.taxAmount;
      return ONBOARDING_DEMO_TAX_SAVED;
    }
    return taxSaved;
  }, [taxDisplayOverride, onboardingStatus, taxSaved, receipts]);

  const handleOnboardingStatusChange = useCallback(
    (next: OnboardingStatus) => {
      setOnboardingStatusState(next);
    },
    [],
  );

  const handleSnapIntent = useCallback(() => {
    if (!onboardingStatus || onboardingStatus === "completed") return true;
    return resolveSnapIntent(onboardingStatus, {
      openSandbox: () => {
        void setOnboardingStatus("stage_2").then(() =>
          setOnboardingStatusState("stage_2"),
        );
      },
    });
  }, [onboardingStatus]);

  const resetOnboarding = useCallback(async () => {
    setTaxDisplayOverride(null);
    const status = await ensureOnboardingInitialized();
    setOnboardingStatusState(status);
    return status;
  }, []);

  return {
    onboardingStatus,
    initializeOnboarding,
    resetOnboarding,
    onboardingInFlow,
    skipSoftGoogleSheet,
    displayTaxSaved,
    taxAnimating,
    setTaxAnimating,
    handleSnapIntent,
    orchestratorProps:
      onboardingInFlow && onboardingStatus
        ? {
            status: onboardingStatus,
            onStatusChange: handleOnboardingStatusChange,
            onRefreshReceipts,
            onGoogleSignIn,
            onGooglePostLogin,
            onTaxDisplayOverride: setTaxDisplayOverride,
            onTaxAnimating: setTaxAnimating,
          }
        : null,
  };
}
