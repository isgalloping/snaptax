"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Receipt } from "@/lib/types";
import { resolveSnapIntent } from "@/components/onboarding/OnboardingOrchestrator";
import { ONBOARDING_DEMO_TAX_SAVED } from "@/lib/onboarding/demoReceipt";
import {
  ensureOnboardingInitialized,
  isOnboardingActive,
  setOnboardingStatus,
  type OnboardingStatus,
} from "@/lib/onboarding/onboardingState";
import { skipOnboarding } from "@/lib/onboarding/skipOnboarding";

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

  const completeAhaCoach = useCallback(async () => {
    setTaxDisplayOverride(null);
    await setOnboardingStatus("completed");
    setOnboardingStatusState("completed");
  }, []);

  const ahaCoachActive = useMemo(
    () => onboardingStatus === "stage_aha",
    [onboardingStatus],
  );

  const dismissAhaCoach = useCallback(() => {
    if (onboardingStatus === "stage_aha") {
      void completeAhaCoach();
    }
  }, [onboardingStatus, completeAhaCoach]);

  const initializeOnboarding = useCallback(async () => {
    const status = await ensureOnboardingInitialized();
    setOnboardingStatusState(status);
    return status;
  }, []);

  const onboardingInFlow = useMemo(
    () =>
      onboardingStatus != null && isOnboardingActive(onboardingStatus),
    [onboardingStatus],
  );

  const skipSoftGoogleSheet = useMemo(
    () => onboardingStatus != null && onboardingStatus !== "completed",
    [onboardingStatus],
  );

  const displayTaxSaved = useMemo(() => {
    if (taxDisplayOverride != null) return taxDisplayOverride;
    if (onboardingStatus === "stage_1") return 0;
    if (onboardingStatus === "stage_aha") {
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

  const skipOnboardingFlow = useCallback(async () => {
    if (!onboardingStatus || !isOnboardingActive(onboardingStatus)) return;
    setTaxDisplayOverride(null);
    await skipOnboarding();
    setOnboardingStatusState("completed");
    await onRefreshReceipts();
  }, [onboardingStatus, onRefreshReceipts]);

  return {
    onboardingStatus,
    initializeOnboarding,
    resetOnboarding,
    skipOnboardingFlow,
    onboardingInFlow,
    skipSoftGoogleSheet,
    displayTaxSaved,
    taxAnimating,
    setTaxAnimating,
    ahaCoachActive,
    dismissAhaCoach,
    completeAhaCoach,
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
