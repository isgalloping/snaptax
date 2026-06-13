"use client";

import { useEffect } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { UserCopy } from "@/lib/i18n";
import {
  getInstallPlatform,
  manualCopyKeyForPlatform,
  type ManualInstallCopyKey,
} from "@/lib/pwa/installPlatform";

interface InstallManualSheetProps {
  open: boolean;
  onClose: () => void;
}

function stepsForPlatform(copy: UserCopy): readonly string[] {
  const key: ManualInstallCopyKey | null = manualCopyKeyForPlatform(
    getInstallPlatform(),
  );
  if (!key) {
    return copy.pwa.manualSteps.chromiumAndroid;
  }
  return copy.pwa.manualSteps[key];
}

export function InstallManualSheet({ open, onClose }: InstallManualSheetProps) {
  const userCopy = useUserCopy();
  const copy = userCopy.pwa;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const steps = stepsForPlatform(userCopy);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-manual-title"
    >
      <button
        type="button"
        aria-label={copy.dismissInstallAria}
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex w-full flex-col rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-4 pb-8"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <h2
          id="install-manual-title"
          className="text-lg font-black uppercase tracking-wider text-white"
        >
          {copy.manualSheetTitle}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          {copy.manualSheetLead}
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm font-bold text-zinc-200">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <button
          type="button"
          onClick={onClose}
          onPointerUp={onClose}
          className="mt-6 min-h-16 w-full cursor-pointer rounded-xl bg-yellow-500 text-sm font-black text-black active:scale-95"
        >
          {copy.manualGotIt}
        </button>
      </div>
    </div>
  );
}
