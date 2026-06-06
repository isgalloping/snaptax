"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (installed || dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t-4 border-yellow-500 bg-zinc-900 p-4 pb-6">
      <p className="text-sm font-bold text-white">安装 Snap1099 到主屏幕</p>
      <p className="mt-1 text-xs text-zinc-400">
        像原生 App 一样快速打开，工地单手拍小票更方便
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="flex-1 min-h-16 rounded-xl bg-yellow-500 py-3 text-sm font-black text-black active:scale-95"
        >
          安装 App
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="min-h-16 px-4 text-sm font-bold text-zinc-400 active:scale-95"
        >
          稍后
        </button>
      </div>
    </div>
  );
}
