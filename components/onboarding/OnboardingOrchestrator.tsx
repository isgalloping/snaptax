"use client";

import { useCallback, useEffect, useState } from "react";
import { GoogleSignInSheet } from "@/components/auth/GoogleSignInSheet";
import {
  ONBOARDING_DEMO_RECEIPT_ID,
  ONBOARDING_DEMO_TAX_SAVED,
  completeDemoReceipt,
} from "@/lib/onboarding/demoReceipt";
import {
  setOnboardingStatus,
  type OnboardingStatus,
} from "@/lib/onboarding/onboardingState";
import { loadReceipt, saveReceipt } from "@/lib/storage/receiptDb";
import { OnboardingSnackbar } from "./OnboardingSnackbar";
import { SandboxCameraSheet } from "./SandboxCameraSheet";
import { useTaxOdometer } from "./TaxSavedOdometer";

export function resolveSnapIntent(
  status: OnboardingStatus,
  handlers: { openSandbox: () => void; openSignup: () => void },
): boolean {
  if (status === "stage_1") {
    handlers.openSandbox();
    return false;
  }
  if (status === "deferred_login") {
    handlers.openSignup();
    return false;
  }
  if (
    status === "stage_2" ||
    status === "stage_3" ||
    status === "stage_4"
  ) {
    return false;
  }
  return true;
}

interface OnboardingOrchestratorProps {
  status: OnboardingStatus;
  onStatusChange: (next: OnboardingStatus) => void;
  onRefreshReceipts: () => Promise<void>;
  onGoogleSuccess: () => Promise<void>;
  onTaxDisplayOverride: (value: number | null) => void;
  onTaxAnimating: (active: boolean) => void;
}

export function OnboardingOrchestrator({
  status,
  onStatusChange,
  onRefreshReceipts,
  onGoogleSuccess,
  onTaxDisplayOverride,
  onTaxAnimating,
}: OnboardingOrchestratorProps) {
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [sandboxBusy, setSandboxBusy] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "stage_4") setSignInError(null);
  }, [status]);

  const odometerValue = useTaxOdometer(
    status === "stage_3",
    0,
    ONBOARDING_DEMO_TAX_SAVED,
    300,
  );

  useEffect(() => {
    if (status === "stage_3") {
      onTaxDisplayOverride(odometerValue);
    } else if (status !== "stage_1" && status !== "stage_4") {
      onTaxDisplayOverride(null);
    }
  }, [status, odometerValue, onTaxDisplayOverride]);

  useEffect(() => {
    if (status !== "stage_3") return;

    onTaxAnimating(true);
    setShowSnackbar(true);

    const toStage4 = window.setTimeout(() => {
      void setOnboardingStatus("stage_4").then(() => onStatusChange("stage_4"));
    }, 400);

    const stopAnim = window.setTimeout(() => onTaxAnimating(false), 600);

    return () => {
      window.clearTimeout(toStage4);
      window.clearTimeout(stopAnim);
    };
  }, [status, onStatusChange, onTaxAnimating]);

  const handleSandboxComplete = useCallback(async () => {
    if (sandboxBusy) return;
    setSandboxBusy(true);
    try {
      const demo = await loadReceipt(ONBOARDING_DEMO_RECEIPT_ID);
      if (demo) {
        await saveReceipt(completeDemoReceipt(demo));
      }
      await onRefreshReceipts();
      await setOnboardingStatus("stage_3");
      onStatusChange("stage_3");
    } finally {
      setSandboxBusy(false);
    }
  }, [sandboxBusy, onRefreshReceipts, onStatusChange]);

  const handleSignupLater = useCallback(async () => {
    await setOnboardingStatus("deferred_login");
    onStatusChange("deferred_login");
  }, [onStatusChange]);

  const handleGoogleDone = useCallback(async () => {
    await onGoogleSuccess();
    await setOnboardingStatus("completed");
    onStatusChange("completed");
  }, [onGoogleSuccess, onStatusChange]);

  return (
    <>
      {status === "stage_2" && (
        <SandboxCameraSheet onComplete={() => void handleSandboxComplete()} />
      )}

      {showSnackbar && (status === "stage_3" || status === "stage_4") && (
        <OnboardingSnackbar onDismiss={() => setShowSnackbar(false)} />
      )}

      {status === "stage_4" && (
        <>
          {signInError && (
            <p
              className="fixed bottom-4 left-4 right-4 z-[60] rounded-xl border border-red-500/60 bg-zinc-900 px-4 py-3 text-center text-sm font-bold text-red-400"
              role="alert"
            >
              {signInError}
            </p>
          )}
          <GoogleSignInSheet
            mode="onboarding-signup"
            onClose={() => {}}
            onSoftDismiss={() => void handleSignupLater()}
            onSuccess={handleGoogleDone}
            onFailure={setSignInError}
          />
        </>
      )}
    </>
  );
}
