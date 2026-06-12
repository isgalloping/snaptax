"use client";

import { useMemo, useState } from "react";
import type { Receipt } from "@/lib/types";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  availableTaxYears,
  taxYearDeductions,
  receiptsInTaxYear,
} from "@/lib/tax/taxYearStats";
import { currentTaxSeason } from "@/lib/tax/season";
import { formatCurrency } from "@/lib/format";
import { clientTimeZone } from "@/lib/time/timeZone";
import {
  exportTaxPack,
  type ExportFormat,
} from "@/lib/client/authApi";
import { shareTaxPackFile } from "@/lib/export/shareTaxPack";

type Step = 1 | 2 | 3;

interface ExportEngineSheetProps {
  receipts: Receipt[];
  onClose: () => void;
  onExported?: () => void;
}

export function ExportEngineSheet({
  receipts,
  onClose,
  onExported,
}: ExportEngineSheetProps) {
  const { copy } = useI18n();
  const t = copy.exportEngine;
  const timeZone = clientTimeZone();
  const defaultYear = Number(currentTaxSeason());

  const years = useMemo(() => {
    const found = availableTaxYears(receipts, timeZone);
    if (found.length === 0) return [defaultYear];
    if (!found.includes(defaultYear)) return [defaultYear, ...found];
    return found;
  }, [receipts, timeZone, defaultYear]);

  const [step, setStep] = useState<Step>(1);
  const [taxYear, setTaxYear] = useState<number>(
    years.includes(defaultYear) ? defaultYear : years[0]!,
  );
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [generating, setGenerating] = useState(false);
  const [readyFile, setReadyFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const yearReceipts = receiptsInTaxYear(receipts, taxYear, timeZone);
  const yearDeductions = taxYearDeductions(receipts, taxYear, timeZone);
  const canContinueStep1 = yearReceipts.length > 0;

  const handleGenerate = async () => {
    setErrorMessage(null);
    if (!navigator.onLine) {
      setErrorMessage(copy.settings.export.offline);
      return;
    }
    setGenerating(true);
    setStep(3);
    try {
      const file = await exportTaxPack({
        taxYear: String(taxYear),
        format,
      });
      setReadyFile(file);
      onExported?.();
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "NO_RECEIPTS") {
          setErrorMessage(copy.settings.export.noReceipts);
        } else if (err.message === "PAYMENT_REQUIRED") {
          setErrorMessage(copy.settings.export.failed);
        } else {
          setErrorMessage(copy.settings.export.failed);
        }
      } else {
        setErrorMessage(copy.settings.export.failed);
      }
      setStep(2);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!readyFile) return;
    await shareTaxPackFile(
      readyFile,
      `Snap1099 ${taxYear}`,
      copy.settings.export.shareText,
    );
  };

  const selectedFormatLabel =
    format === "csv" ? t.formatCsvTitle : t.formatCpaTitle;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-black uppercase tracking-wider text-white">
              {t.title}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t.stepLabel.replace("{step}", String(step)).replace("{total}", "3")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 text-lg font-black text-zinc-300 transition-transform active:scale-95"
            aria-label={t.close}
          >
            ×
          </button>
        </div>

        {step === 1 && (
          <>
            <p className="mb-4 text-sm font-bold text-zinc-300">{t.step1Heading}</p>
            <div className="space-y-3">
              {years.map((year) => {
                const count = receiptsInTaxYear(receipts, year, timeZone).length;
                const deductions = taxYearDeductions(receipts, year, timeZone);
                const selected = taxYear === year;
                const disabled = count === 0;
                return (
                  <button
                    key={year}
                    type="button"
                    disabled={disabled}
                    onClick={() => setTaxYear(year)}
                    className={`w-full min-h-[88px] rounded-xl border-2 p-4 text-left transition-transform active:scale-95 disabled:opacity-40 ${
                      selected
                        ? "border-yellow-500 bg-yellow-950"
                        : "border-zinc-600 bg-zinc-800"
                    }`}
                  >
                    <p className="text-sm font-black uppercase tracking-wider text-white">
                      {selected ? "✓ " : ""}
                      {t.yearCard.replace("{year}", String(year))}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {t.yearRange.replace("{year}", String(year))}
                    </p>
                    <p className="mt-2 text-sm font-bold text-yellow-400">
                      {t.deductionsLabel.replace(
                        "{amount}",
                        formatCurrency(deductions),
                      )}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {count === 0
                        ? t.noReceiptsYear
                        : t.receiptsLabel.replace("{count}", String(count))}
                    </p>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={!canContinueStep1}
              onClick={() => setStep(2)}
              className="mt-6 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-50"
            >
              {t.continue}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="mb-1 text-xs font-bold text-zinc-400">
              {t.yearSummary
                .replace("{year}", String(taxYear))
                .replace("{amount}", formatCurrency(yearDeductions))
                .replace("{count}", String(yearReceipts.length))}
            </p>
            <p className="mb-4 text-sm font-bold text-zinc-300">{t.step2Heading}</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`w-full min-h-[88px] rounded-xl border-2 p-4 text-left transition-transform active:scale-95 ${
                  format === "csv"
                    ? "border-yellow-500 bg-yellow-950"
                    : "border-zinc-600 bg-zinc-800"
                }`}
              >
                <p className="text-sm font-black uppercase tracking-wider text-white">
                  {format === "csv" ? "✓ " : ""}
                  {t.formatCsvTitle}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {t.formatCsvHint}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setFormat("cpa_pack")}
                className={`w-full min-h-[88px] rounded-xl border-2 p-4 text-left transition-transform active:scale-95 ${
                  format === "cpa_pack"
                    ? "border-yellow-500 bg-yellow-950"
                    : "border-zinc-600 bg-zinc-800"
                }`}
              >
                <p className="text-sm font-black uppercase tracking-wider text-white">
                  {format === "cpa_pack" ? "✓ " : ""}
                  {t.formatCpaTitle}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {t.formatCpaHint}
                </p>
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-16 rounded-xl border-2 border-zinc-600 bg-zinc-800 py-4 text-sm font-black uppercase tracking-wider text-white transition-transform active:scale-95"
              >
                {t.back}
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={() => void handleGenerate()}
                className="min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-sm font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
              >
                {t.generate}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="mb-4 text-sm font-bold text-zinc-300">{t.step3Heading}</p>
            {generating ? (
              <div className="py-10 text-center">
                <p className="text-sm font-bold text-yellow-400">{t.generating}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  {taxYear} · {selectedFormatLabel} · {yearReceipts.length}{" "}
                  receipts
                </p>
              </div>
            ) : readyFile ? (
              <div className="py-6 text-center">
                <p className="text-sm font-bold text-green-400">{t.ready}</p>
                <p className="mt-2 truncate text-xs text-zinc-400">{readyFile.name}</p>
                <button
                  type="button"
                  onClick={() => void handleShare()}
                  className="mt-6 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95"
                >
                  {t.share}
                </button>
              </div>
            ) : null}
          </>
        )}

        {errorMessage && (
          <p className="mt-4 text-center text-sm font-bold text-red-500" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
