"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  canNativeInstallPrompt,
  clearDeferredInstallPrompt,
  dismissInstallBar,
  getDeferredInstallPrompt,
  hasDismissedInstallBar,
  isInstallEligible,
  isLandingDone,
  isStandaloneDisplayMode,
  markPwaVisited,
  subscribeInstallPrompt,
  subscribeLandingDone,
  type InstallUiMode,
} from "@/lib/pwa/deferredInstall";
import { isPwaInstalledOnDevice, resolveInstallUiModeWithInstalled } from "@/lib/pwa/installedDetect";
import { supportsNativeInstallPrompt, getInstallPlatform } from "@/lib/pwa/installPlatform";
import {
  PwaInstallContext,
  type PwaInstallContextValue,
} from "./pwaInstallContext";
import { InstallManualSheet } from "./InstallManualSheet";
import { InstallPrompt } from "./InstallPrompt";

function useInstallUiState(): PwaInstallContextValue {
  const [mode, setMode] = useState<InstallUiMode>("none");
  const [canPrompt, setCanPrompt] = useState(false);
  const [manualSheetOpen, setManualSheetOpen] = useState(false);

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
        isInstallEligible(),
        hasDismissedInstallBar(),
      ),
    );
  }, []);

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
    } else {
      const onLanding = () => {
        markPwaVisited();
        document.addEventListener("pointerdown", onEngage, { once: true });
        void sync();
      };
      window.addEventListener("snap1099:landing-done", onLanding, {
        once: true,
      });
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

    return () => {
      unsubPrompt();
      unsubLanding();
      document.removeEventListener("visibilitychange", onVisible);
      if (onController) {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          onController,
        );
      }
      for (const id of recheckDelays) window.clearTimeout(id);
    };
  }, [sync]);

  const acknowledgeManualSheet = useCallback(() => {
    setManualSheetOpen(false);
    dismissInstallBar();
    void sync();
  }, [sync]);

  const install = useCallback(async () => {
    if (await isPwaInstalledOnDevice()) {
      setMode("none");
      return;
    }

    const platform = getInstallPlatform();
    if (!supportsNativeInstallPrompt(platform)) {
      setManualSheetOpen(true);
      return;
    }

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

  const dismissBar = useCallback(() => {
    dismissInstallBar();
    setManualSheetOpen(false);
    void sync();
  }, [sync]);

  return useMemo(
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
}

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const value = useInstallUiState();
  return (
    <PwaInstallContext.Provider value={value}>
      {children}
      <InstallPrompt />
      <InstallManualSheet
        open={value.manualSheetOpen}
        onClose={value.closeManualSheet}
      />
    </PwaInstallContext.Provider>
  );
}
