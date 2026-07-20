"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import { SettingsSubPageShell } from "@/components/settings/SettingsSubPageShell";
import { sampleTurboTaxCsvFilename } from "@/lib/export/exportFilenames";
import { defaultExportTaxYear } from "@/lib/tax/season";

interface SampleExportPageProps {
  onBack: () => void;
  onDownload: () => void;
  onContinueGoogle: () => void;
  downloading?: boolean;
}

export function SampleExportPage({
  onBack,
  onDownload,
  onContinueGoogle,
  downloading = false,
}: SampleExportPageProps) {
  const copy = useUserCopy().settings.exportFlow;
  const taxYear = defaultExportTaxYear();
  const fileName = sampleTurboTaxCsvFilename(taxYear);

  return (
    <SettingsSubPageShell title={copy.sampleTitle} onBack={onBack}>
      <div className="rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Sample file
        </p>
        <p className="mt-2 break-all text-sm font-bold text-white">{fileName}</p>
      </div>

      <button
        type="button"
        disabled={downloading}
        onClick={onDownload}
        className="mt-6 flex w-full min-h-16 items-center justify-center rounded-xl border-4 border-white bg-yellow-500 px-4 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
      >
        {copy.downloadCsv}
      </button>

      <button
        type="button"
        onClick={onContinueGoogle}
        className="mt-3 flex w-full min-h-16 items-center justify-center rounded-xl border-2 border-white bg-transparent px-4 py-4 text-lg font-black uppercase tracking-wider text-white transition-transform active:scale-95"
      >
        {copy.continueGoogle}
      </button>
    </SettingsSubPageShell>
  );
}
