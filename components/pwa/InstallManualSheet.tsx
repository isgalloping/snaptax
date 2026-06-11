"use client";

import { useTranslations } from "next-intl";
import {
  getInstallPlatform,
  manualCopyKeyForPlatform,
  type ManualInstallCopyKey,
} from "@/lib/pwa/installPlatform";

interface InstallManualSheetProps {
  open: boolean;
  onClose: () => void;
}

const STEP_KEYS: Record<ManualInstallCopyKey, readonly string[]> = {
  chromiumAndroid: [
    "manualStepChromiumAndroid1",
    "manualStepChromiumAndroid2",
    "manualStepChromiumAndroid3",
  ],
  chromiumDesktop: [
    "manualStepChromiumDesktop1",
    "manualStepChromiumDesktop2",
    "manualStepChromiumDesktop3",
  ],
  iosSafari: [
    "manualStepIosSafari1",
    "manualStepIosSafari2",
    "manualStepIosSafari3",
  ],
  macosSafari: [
    "manualStepMacosSafari1",
    "manualStepMacosSafari2",
    "manualStepMacosSafari3",
  ],
};

export function InstallManualSheet({ open, onClose }: InstallManualSheetProps) {
  const t = useTranslations("Pwa");

  if (!open) return null;

  const copyKey: ManualInstallCopyKey | null = manualCopyKeyForPlatform(
    getInstallPlatform(),
  );
  const keys = STEP_KEYS[copyKey ?? "chromiumAndroid"];

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
          {t("manualSheetTitle")}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">{t("subtitle")}</p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm font-bold text-zinc-200">
          {keys.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-16 w-full rounded-xl bg-yellow-500 text-sm font-black text-black active:scale-95"
        >
          {t("manualGotIt")}
        </button>
      </div>
    </div>
  );
}
