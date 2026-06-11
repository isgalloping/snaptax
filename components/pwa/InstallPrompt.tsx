"use client";

import { USER_COPY } from "@/lib/copy/userFacing";
import { usePwaInstall } from "./pwaInstallContext";

export function InstallPrompt() {
  const { mode, canPrompt, install, dismissBar } = usePwaInstall();

  if (mode !== "bar") return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-yellow-500 bg-zinc-900 p-4 pb-6">
      <p className="text-sm font-bold text-white">{USER_COPY.pwa.title}</p>
      <p className="mt-1 text-xs text-zinc-400">{USER_COPY.pwa.subtitle}</p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => void install()}
          className="min-h-16 flex-1 rounded-xl bg-yellow-500 py-3 text-sm font-black text-black active:scale-95"
        >
          {canPrompt ? USER_COPY.pwa.install : USER_COPY.pwa.howToInstall}
        </button>
        <button
          type="button"
          onClick={dismissBar}
          className="min-h-16 px-4 text-sm font-bold text-zinc-400 active:scale-95"
        >
          {USER_COPY.pwa.dismiss}
        </button>
      </div>
    </div>
  );
}
