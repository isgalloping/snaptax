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
  onGoogleSuccess: () => Promise<void>;
}

export function useOnboardingFlow({
  receipts,
  taxSaved,
  onRefreshReceipts,
  onGoogleSuccess,
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
        onboardingStatus === "stage_4" ||
        onboardingStatus === "deferred_login"),
    [onboardingStatus],
  );

  const skipSoftGoogleSheet = useMemo(
    () => onboardingStatus != null && onboardingStatus !== "completed",
    [onboardingStatus],
  );

  const displayTaxSaved = useMemo(() => {
    if (taxDisplayOverride != null) return taxDisplayOverride;
    if (onboardingStatus === "stage_1") return 0;
    if (
      onboardingStatus === "stage_4" ||
      onboardingStatus === "deferred_login"
    ) {
      const demo = receipts.find(
        (r) => r.isOnboardingDemo && r.status === "done",
      );
      if (demo?.taxAmount != null) return demo.taxAmount;
      if (onboardingStatus === "stage_4") return ONBOARDING_DEMO_TAX_SAVED;
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
      openSignup: () => {
        void setOnboardingStatus("stage_4").then(() =>
          setOnboardingStatusState("stage_4"),
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
    handleSnapIntent,
    orchestratorProps:
      onboardingInFlow && onboardingStatus
        ? {
            status: onboardingStatus,
            onStatusChange: handleOnboardingStatusChange,
            onRefreshReceipts,
            onGoogleSuccess,
            onTaxDisplayOverride: setTaxDisplayOverride,
            onTaxAnimating: setTaxAnimating,
          }
        : null,
  };
}
