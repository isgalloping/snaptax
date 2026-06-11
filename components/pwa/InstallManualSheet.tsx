"use client";

import { USER_COPY } from "@/lib/copy/userFacing";
import {
  getInstallPlatform,
  manualCopyKeyForPlatform,
  type ManualInstallCopyKey,
} from "@/lib/pwa/installPlatform";

interface InstallManualSheetProps {
  open: boolean;
  onClose: () => void;
}

function stepsForPlatform(): readonly string[] {
  const key: ManualInstallCopyKey | null = manualCopyKeyForPlatform(
    getInstallPlatform(),
  );
  if (!key) {
    return USER_COPY.pwa.manualSteps.chromiumAndroid;
  }
  return USER_COPY.pwa.manualSteps[key];
}

export function InstallManualSheet({ open, onClose }: InstallManualSheetProps) {
  if (!open) return null;

  const steps = stepsForPlatform();

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/70">
      <div
        className="flex w-full flex-col rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-4 pb-8"
        role="dialog"
        aria-labelledby="install-manual-title"
      >
        <h2
          id="install-manual-title"
          className="text-lg font-black uppercase tracking-wider text-white"
        >
          {USER_COPY.pwa.manualSheetTitle}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">{USER_COPY.pwa.subtitle}</p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm font-bold text-zinc-200">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-16 w-full rounded-xl bg-yellow-500 text-sm font-black text-black active:scale-95"
        >
          {USER_COPY.pwa.manualGotIt}
        </button>
      </div>
    </div>
  );
}
