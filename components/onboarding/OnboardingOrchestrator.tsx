"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ONBOARDING_DEMO_TAX_SAVED,
  ensureOnboardingDemoDone,
} from "@/lib/onboarding/demoReceipt";
import {
  setOnboardingStatus,
  type OnboardingStatus,
} from "@/lib/onboarding/onboardingState";
import { OnboardingSnackbar } from "./OnboardingSnackbar";
import { SandboxCameraSheet } from "./SandboxCameraSheet";
import { useTaxOdometer } from "./TaxSavedOdometer";

export function resolveSnapIntent(
  status: OnboardingStatus,
  handlers: { openSandbox: () => void },
): boolean {
  if (status === "stage_1") {
    handlers.openSandbox();
    return false;
  }
  if (status === "stage_2" || status === "stage_3") {
    return false;
  }
  return true;
}

interface OnboardingOrchestratorProps {
  status: OnboardingStatus;
  onStatusChange: (next: OnboardingStatus) => void;
  onRefreshReceipts: () => Promise<void>;
  onGoogleSignIn: () => Promise<{ taxRecalcQueued: number }>;
  onGooglePostLogin: (taxRecalcQueued: number) => Promise<void>;
  onTaxDisplayOverride: (value: number | null) => void;
  onTaxAnimating: (active: boolean) => void;
}

export function OnboardingOrchestrator({
  status,
  onStatusChange,
  onRefreshReceipts,
  onTaxDisplayOverride,
  onTaxAnimating,
}: OnboardingOrchestratorProps) {
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [sandboxBusy, setSandboxBusy] = useState(false);

  const onRefreshRef = useRef(onRefreshReceipts);
  const onStatusChangeRef = useRef(onStatusChange);
  const onTaxAnimatingRef = useRef(onTaxAnimating);
  const onTaxDisplayOverrideRef = useRef(onTaxDisplayOverride);
  onRefreshRef.current = onRefreshReceipts;
  onStatusChangeRef.current = onStatusChange;
  onTaxAnimatingRef.current = onTaxAnimating;
  onTaxDisplayOverrideRef.current = onTaxDisplayOverride;

  const odometerValue = useTaxOdometer(
    status === "stage_3",
    0,
    ONBOARDING_DEMO_TAX_SAVED,
    300,
  );

  useEffect(() => {
    if (status === "stage_3") {
      onTaxDisplayOverrideRef.current(odometerValue);
    } else if (status !== "stage_1") {
      onTaxDisplayOverrideRef.current(null);
    }
  }, [status, odometerValue]);

  useEffect(() => {
    if (status !== "stage_3") return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    void (async () => {
      await ensureOnboardingDemoDone();
      if (cancelled) return;
      await onRefreshRef.current();
      if (cancelled) return;

      onTaxAnimatingRef.current(true);
      setShowSnackbar(true);

      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          void setOnboardingStatus("stage_aha").then(() =>
            onStatusChangeRef.current("stage_aha"),
          );
        }, 400),
      );

      timers.push(
        window.setTimeout(() => {
          if (!cancelled) onTaxAnimatingRef.current(false);
        }, 600),
      );
    })();

    return () => {
      cancelled = true;
      for (const id of timers) window.clearTimeout(id);
    };
  }, [status]);

  const handleSandboxComplete = useCallback(async () => {
    if (sandboxBusy) return;
    setSandboxBusy(true);
    try {
      await ensureOnboardingDemoDone();
      await onRefreshRef.current();
      await setOnboardingStatus("stage_3");
      onStatusChangeRef.current("stage_3");
    } finally {
      setSandboxBusy(false);
    }
  }, [sandboxBusy]);

  return (
    <>
      {status === "stage_2" && (
        <SandboxCameraSheet onComplete={() => void handleSandboxComplete()} />
      )}

      {showSnackbar && status === "stage_3" && (
        <OnboardingSnackbar onDismiss={() => setShowSnackbar(false)} />
      )}
    </>
  );
}
