"use client";

import { useTranslations } from "next-intl";

interface SyncInstructionsSheetProps {
  email: string;
  onClose: () => void;
}

export function SyncInstructionsSheet({
  email,
  onClose,
}: SyncInstructionsSheetProps) {
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
        <p className="text-lg font-black uppercase tracking-wider text-white">
          {t("syncTitle")}
        </p>
        <p className="mt-2 text-sm font-bold text-yellow-400">{t("syncSignedInAs", { email })}</p>
        <ol className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-300">
          <li>{t("syncStep1")}</li>
          <li>{t("syncStep2")}</li>
          <li>{t("syncStep3")}</li>
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full min-h-16 rounded-xl border-2 border-zinc-600 bg-zinc-800 py-4 text-sm font-black uppercase tracking-wider text-white transition-transform active:scale-95"
        >
          {tCommon("gotIt")}
        </button>
      </div>
    </div>
  );
}
