"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  canNativeInstallPrompt,
  clearDeferredInstallPrompt,
  dismissInstallBar,
  getDeferredInstallPrompt,
  hasDismissedInstallBar,
  isBrowserInstallEligible,
  isInstallEligible,
  isLandingDone,
  isStandaloneDisplayMode,
  markPwaVisited,
  subscribeInstallPrompt,
  subscribeLandingDone,
  type InstallUiMode,
} from "@/lib/pwa/deferredInstall";
import { isPwaInstalledOnDevice, resolveInstallUiModeWithInstalled } from "@/lib/pwa/installedDetect";
import {
  APP_ENTRY_GATE_DISMISSED_EVENT,
  shouldSuppressInstallBarAfterGateSkip,
} from "@/lib/pwa/appBrowserEntry";
import { supportsNativeInstallPrompt, getInstallPlatform } from "@/lib/pwa/installPlatform";
import {
  PwaInstallContext,
  type PwaInstallContextValue,
} from "./pwaInstallContext";
import { InstallManualSheet } from "./InstallManualSheet";
import { InstallPrompt } from "./InstallPrompt";
import { LaunchFromHomeHint } from "./LaunchFromHomeHint";
import {
  WebApkLaunchGuideSheet,
  type WebApkGuideVariant,
} from "./WebApkLaunchGuideSheet";

function useInstallUiState(options: {
  requireLandingDone: boolean;
  suppressWebApkGuide: boolean;
  suppressInstallBar: boolean;
}) {
  const { requireLandingDone, suppressWebApkGuide, suppressInstallBar } = options;

  const isEligible = useCallback(() => {
    return requireLandingDone ? isInstallEligible() : isBrowserInstallEligible();
  }, [requireLandingDone]);

  const [mode, setMode] = useState<InstallUiMode>("none");
  const [canPrompt, setCanPrompt] = useState(false);
  const [manualSheetOpen, setManualSheetOpen] = useState(false);
  const [webApkGuideOpen, setWebApkGuideOpen] = useState(false);
  const [webApkGuideVariant, setWebApkGuideVariant] =
    useState<WebApkGuideVariant>("pre-install");
  const pendingNativeInstallRef = useRef(false);

  const sync = useCallback(async () => {
    setCanPrompt(canNativeInstallPrompt());

    const installed = await isPwaInstalledOnDevice();
    if (installed) {
      setMode("none");
      setManualSheetOpen(false);
      return;
    }

    setMode(
      resolveInstallUiModeWithInstalled(
        false,
        isEligible(),
        hasDismissedInstallBar() ||
          shouldSuppressInstallBarAfterGateSkip() ||
          suppressInstallBar,
      ),
    );
  }, [isEligible, suppressInstallBar]);

  const runNativeInstall = useCallback(async () => {
    const deferredPrompt = getDeferredInstallPrompt();
    if (!deferredPrompt) {
      setManualSheetOpen(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        clearDeferredInstallPrompt();
        setManualSheetOpen(false);
        setMode("none");
      }
    } catch {
      setManualSheetOpen(true);
    }
    void sync();
  }, [sync]);

  useEffect(() => {
    if (isStandaloneDisplayMode()) {
      setMode("none");
    }

    void sync();
    const unsubPrompt = subscribeInstallPrompt(() => {
      void sync();
    });
    const unsubLanding = subscribeLandingDone(() => {
      markPwaVisited();
      void sync();
    });

    const recheckDelays = [500, 1500, 4000, 8000].map((ms) =>
      window.setTimeout(() => void sync(), ms),
    );

    const onEngage = () => {
      window.setTimeout(() => void sync(), 300);
      window.setTimeout(() => void sync(), 1500);
    };

    if (isLandingDone()) {
      markPwaVisited();
      document.addEventListener("pointerdown", onEngage, { once: true });
    } else if (requireLandingDone) {
      const onLanding = () => {
        markPwaVisited();
        document.addEventListener("pointerdown", onEngage, { once: true });
        void sync();
      };
      window.addEventListener("snap1099:landing-done", onLanding, {
        once: true,
      });
    } else {
      markPwaVisited();
      document.addEventListener("pointerdown", onEngage, { once: true });
    }

    let onController: (() => void) | undefined;
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then(() => sync());
      onController = () => void sync();
      navigator.serviceWorker.addEventListener("controllerchange", onController);
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", onVisible);

    const onInstalled = () => {
      if (suppressWebApkGuide) return;
      if (getInstallPlatform() !== "chromium-android") return;
      setWebApkGuideVariant("post-install");
      setWebApkGuideOpen(true);
    };
    window.addEventListener("appinstalled", onInstalled);

    const onGateDismissed = () => {
      void sync();
    };
    window.addEventListener(APP_ENTRY_GATE_DISMISSED_EVENT, onGateDismissed);

    return () => {
      unsubPrompt();
      unsubLanding();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(APP_ENTRY_GATE_DISMISSED_EVENT, onGateDismissed);
      if (onController) {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          onController,
        );
      }
      for (const id of recheckDelays) window.clearTimeout(id);
    };
  }, [sync, requireLandingDone, suppressWebApkGuide, suppressInstallBar]);

  const acknowledgeManualSheet = useCallback(() => {
    setManualSheetOpen(false);
    dismissInstallBar();
    requestAnimationFrame(() => {
      void sync();
    });
  }, [sync]);

  const install = useCallback(async () => {
    const platform = getInstallPlatform();
    if (!supportsNativeInstallPrompt(platform)) {
      setManualSheetOpen(true);
      return;
    }

    if (await isPwaInstalledOnDevice()) {
      setMode("none");
      return;
    }

    const deferredPrompt = getDeferredInstallPrompt();
    if (!deferredPrompt) {
      setManualSheetOpen(true);
      return;
    }

    if (platform === "chromium-android") {
      pendingNativeInstallRef.current = true;
      setWebApkGuideVariant("pre-install");
      setWebApkGuideOpen(true);
      return;
    }

    await runNativeInstall();
  }, [runNativeInstall]);

  const handleWebApkGuideContinue = useCallback(() => {
    setWebApkGuideOpen(false);
    if (pendingNativeInstallRef.current) {
      pendingNativeInstallRef.current = false;
      void runNativeInstall();
    }
  }, [runNativeInstall]);

  const handleWebApkGuideDismiss = useCallback(() => {
    pendingNativeInstallRef.current = false;
    setWebApkGuideOpen(false);
  }, []);

  const dismissBar = useCallback(() => {
    dismissInstallBar();
    setManualSheetOpen(false);
    void sync();
  }, [sync]);

  const contextValue = useMemo<PwaInstallContextValue>(
    () => ({
      mode,
      canPrompt,
      manualSheetOpen,
      install,
      dismissBar,
      closeManualSheet: acknowledgeManualSheet,
    }),
    [mode, canPrompt, manualSheetOpen, install, dismissBar, acknowledgeManualSheet],
  );

  return {
    contextValue,
    webApkGuideOpen,
    webApkGuideVariant,
    handleWebApkGuideContinue,
    handleWebApkGuideDismiss,
  };
}

export function PwaInstallProvider({
  children,
  requireLandingDone = true,
  showLaunchFromHomeHint = true,
  suppressWebApkGuide = false,
  suppressInstallBar = false,
}: {
  children: ReactNode;
  requireLandingDone?: boolean;
  showLaunchFromHomeHint?: boolean;
  suppressWebApkGuide?: boolean;
  suppressInstallBar?: boolean;
}) {
  const {
    contextValue,
    webApkGuideOpen,
    webApkGuideVariant,
    handleWebApkGuideContinue,
    handleWebApkGuideDismiss,
  } = useInstallUiState({
    requireLandingDone,
    suppressWebApkGuide,
    suppressInstallBar,
  });

  return (
    <PwaInstallContext.Provider value={contextValue}>
      {children}
      {showLaunchFromHomeHint ? <LaunchFromHomeHint /> : null}
      <InstallPrompt />
      <InstallManualSheet
        open={contextValue.manualSheetOpen}
        onClose={contextValue.closeManualSheet}
      />
      <WebApkLaunchGuideSheet
        open={webApkGuideOpen}
        variant={webApkGuideVariant}
        onContinue={handleWebApkGuideContinue}
        onDismiss={handleWebApkGuideDismiss}
      />
    </PwaInstallContext.Provider>
  );
}
