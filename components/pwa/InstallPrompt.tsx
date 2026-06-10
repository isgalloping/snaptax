"use client";

import { useCallback, useEffect, useState } from "react";
import { USER_COPY } from "@/lib/copy/userFacing";
import {
  clearDeferredInstallPrompt,
  dismissInstallPrompt,
  getDeferredInstallPrompt,
  shouldShowInstallPrompt,
  subscribeInstallPrompt,
  subscribeLandingDone,
} from "@/lib/pwa/deferredInstall";

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);

  const syncVisibility = useCallback(() => {
    setVisible(shouldShowInstallPrompt());
  }, []);

  useEffect(() => {
    syncVisibility();
    const unsubPrompt = subscribeInstallPrompt(syncVisibility);
    const unsubLanding = subscribeLandingDone(syncVisibility);
    return () => {
      unsubPrompt();
      unsubLanding();
    };
  }, [syncVisibility]);

  const handleInstall = async () => {
    const deferredPrompt = getDeferredInstallPrompt();
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      clearDeferredInstallPrompt();
    }
    syncVisibility();
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-yellow-500 bg-zinc-900 p-4 pb-6">
      <p className="text-sm font-bold text-white">{USER_COPY.pwa.title}</p>
      <p className="mt-1 text-xs text-zinc-400">{USER_COPY.pwa.subtitle}</p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="min-h-16 flex-1 rounded-xl bg-yellow-500 py-3 text-sm font-black text-black active:scale-95"
        >
          {USER_COPY.pwa.install}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="min-h-16 px-4 text-sm font-bold text-zinc-400 active:scale-95"
        >
          {USER_COPY.pwa.dismiss}
        </button>
      </div>
    </div>
  );
}
