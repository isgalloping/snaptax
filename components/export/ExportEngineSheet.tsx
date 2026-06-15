"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Receipt } from "@/lib/types";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  availableTaxYears,
  taxYearDeductions,
  receiptsInTaxYear,
} from "@/lib/tax/taxYearStats";
import { defaultExportTaxYear } from "@/lib/tax/season";
import { receiptsNeedingExportReview } from "@/lib/tax/exportReview";
import { formatCurrency } from "@/lib/format";
import { clientTimeZone } from "@/lib/time/timeZone";
import {
  exportTaxPack,
  type ExportFormat,
  type ExportTaxPackMeta,
} from "@/lib/client/authApi";
import { shareTaxPackFile } from "@/lib/export/shareTaxPack";
import { buildLocalTurboTaxCsv } from "@/lib/export/buildLocalTurboTaxCsv";
import { ExportCategoryReview } from "@/components/export/ExportCategoryReview";

type Step = 1 | 2 | 3 | 4;

interface ExportEngineSheetProps {
  receipts: Receipt[];
  onClose: () => void;
  onPreExportPrepare?: () => Promise<void>;
  onExported?: () => void | Promise<void>;
  onPaymentRequired?: () => void;
  onReceiptUpdated?: (receipt: Receipt) => void;
}

const PROGRESS_TICK_MS = 16;
const FAST_RAMP_MS = 300;

export function ExportEngineSheet({
  receipts,
  onClose,
  onPreExportPrepare,
  onExported,
  onPaymentRequired,
  onReceiptUpdated,
}: ExportEngineSheetProps) {
  const { copy } = useI18n();
  const t = copy.exportEngine;
  const timeZone = clientTimeZone();
  const defaultYear = Number(defaultExportTaxYear());

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
  const [previewing, setPreviewing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [readyFile, setReadyFile] = useState<File | null>(null);
  const [exportMeta, setExportMeta] = useState<ExportTaxPackMeta | null>(null);
  const [sharing, setSharing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const autoSharedRef = useRef(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const yearReceipts = receiptsInTaxYear(receipts, taxYear, timeZone);
  const yearDeductions = taxYearDeductions(receipts, taxYear, timeZone);
  const reviewReceipts = useMemo(
    () => receiptsNeedingExportReview(yearReceipts),
    [yearReceipts],
  );
  const includesReview = reviewReceipts.length > 0;
  const totalSteps = includesReview ? 4 : 3;
  const canContinueStep1 = yearReceipts.length > 0;

  const displayStep = useMemo(() => {
    if (!includesReview && step >= 2) return step - 1;
    return step;
  }, [includesReview, step]);

  const clearProgressTimer = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const startProgressRamp = (selectedFormat: ExportFormat, receiptCount: number) => {
    clearProgressTimer();
    setProgress(0);
    setProgressLabel(t.progressPreparing);
    const startedAt = Date.now();
    const imageHeavy =
      selectedFormat === "cpa_pack" || selectedFormat === "cpa_pdf";
    const durationMs = imageHeavy
      ? Math.min(12000, 1200 + receiptCount * 60)
      : FAST_RAMP_MS;

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const ratio = Math.min(1, elapsed / durationMs);
      const cap = imageHeavy ? 88 : 90;
      setProgress(ratio * cap);
      if (imageHeavy && ratio > 0.25) {
        setProgressLabel(t.progressFetchingImages);
      }
      if (ratio >= 1) clearProgressTimer();
    }, PROGRESS_TICK_MS);
  };

  const finishProgress = () => {
    clearProgressTimer();
    setProgressLabel(t.progressFinalizing);
    setProgress(100);
    if ("vibrate" in navigator) navigator.vibrate(50);
  };

  useEffect(() => () => clearProgressTimer(), []);

  const handleShare = async (file: File) => {
    setSharing(true);
    try {
      await shareTaxPackFile(
        file,
        `Snap1099 ${taxYear}`,
        copy.settings.export.shareText,
      );
    } finally {
      setSharing(false);
    }
  };

  useEffect(() => {
    if (!readyFile || autoSharedRef.current) return;
    autoSharedRef.current = true;
    void handleShare(readyFile);
  }, [readyFile]);

  const goToFormatStep = () => {
    setStep(includesReview ? 3 : 2);
  };

  const handleContinueFromYear = () => {
    if (includesReview) {
      setStep(2);
    } else {
      goToFormatStep();
    }
  };

  const handlePreviewCsv = async () => {
    setErrorMessage(null);
    setPreviewing(true);
    try {
      const csv = buildLocalTurboTaxCsv(receipts, taxYear, timeZone);
      const file = new File(
        [csv],
        `Snap1099-${taxYear}-TurboTax-Preview.csv`,
        { type: "text/csv" },
      );
      await shareTaxPackFile(
        file,
        `Snap1099 ${taxYear} Preview`,
        copy.settings.export.shareText,
      );
    } catch {
      setErrorMessage(copy.settings.export.failed);
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    setErrorMessage(null);
    autoSharedRef.current = false;
    if (!navigator.onLine) {
      setErrorMessage(copy.settings.export.offline);
      return;
    }
    setGenerating(true);
    setReadyFile(null);
    setExportMeta(null);
    setStep(4);
    startProgressRamp(format, yearReceipts.length);
    try {
      if (onPreExportPrepare) {
        await onPreExportPrepare();
      }
      const result = await exportTaxPack({
        taxYear: String(taxYear),
        format,
      });
      finishProgress();
      setReadyFile(result.file);
      setExportMeta(result.meta);
      await onExported?.();
    } catch (err) {
      clearProgressTimer();
      setProgress(0);
      setProgressLabel("");
      if (err instanceof Error) {
        if (err.message === "EXPORT_OFFLINE") {
          setErrorMessage(copy.settings.export.offline);
        } else if (err.message === "NO_RECEIPTS") {
          setErrorMessage(copy.settings.export.noReceipts);
        } else if (err.message === "PAYMENT_REQUIRED") {
          onClose();
          onPaymentRequired?.();
          return;
        } else {
          setErrorMessage(copy.settings.export.failed);
        }
      } else {
        setErrorMessage(copy.settings.export.failed);
      }
      goToFormatStep();
    } finally {
      setGenerating(false);
    }
  };

  const selectedFormatLabel =
    format === "csv"
      ? t.formatCsvTitle
      : format === "cpa_pdf"
        ? t.formatCpaPdfTitle
        : t.formatCpaTitle;

  const imageWarning =
    exportMeta?.imagesMissing != null && exportMeta.imagesMissing > 0
      ? t.imagesMissing.replace("{missing}", String(exportMeta.imagesMissing))
      : null;

  const imageSummary =
    exportMeta?.imagesEligible != null && exportMeta.imagesIncluded != null
      ? t.imagesComplete
          .replace("{included}", String(exportMeta.imagesIncluded))
          .replace("{eligible}", String(exportMeta.imagesEligible))
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-black uppercase tracking-wider text-white">
              {t.title}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t.stepLabel
                .replace("{step}", String(displayStep))
                .replace("{total}", String(totalSteps))}
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
              onClick={handleContinueFromYear}
              className="mt-6 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-50"
            >
              {t.continue}
            </button>
          </>
        )}

        {step === 2 && includesReview && (
          <>
            <p className="mb-1 text-xs font-bold text-zinc-400">
              {t.receiptsLabel.replace("{count}", String(reviewReceipts.length))}
            </p>
            <p className="mb-4 text-sm font-bold text-zinc-300">{t.step2Heading}</p>
            <ExportCategoryReview
              receipts={reviewReceipts}
              onReceiptUpdated={(updated) => onReceiptUpdated?.(updated)}
            />
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
                onClick={goToFormatStep}
                className="min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-sm font-black uppercase tracking-wider text-black transition-transform active:scale-95"
              >
                {t.continue}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="mb-1 text-xs font-bold text-zinc-400">
              {t.yearSummary
                .replace("{year}", String(taxYear))
                .replace("{amount}", formatCurrency(yearDeductions))
                .replace("{count}", String(yearReceipts.length))}
            </p>
            <p className="mb-4 text-sm font-bold text-zinc-300">{t.stepFormatHeading}</p>
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
              <button
                type="button"
                onClick={() => setFormat("cpa_pdf")}
                className={`w-full min-h-[88px] rounded-xl border-2 p-4 text-left transition-transform active:scale-95 ${
                  format === "cpa_pdf"
                    ? "border-yellow-500 bg-yellow-950"
                    : "border-zinc-600 bg-zinc-800"
                }`}
              >
                <p className="text-sm font-black uppercase tracking-wider text-white">
                  {format === "cpa_pdf" ? "✓ " : ""}
                  {t.formatCpaPdfTitle}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {t.formatCpaPdfHint}
                </p>
              </button>
            </div>

            {format === "csv" && (
              <div className="mt-4 rounded-xl border-2 border-zinc-700 bg-zinc-950 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-yellow-400">
                  TurboTax
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-zinc-400">
                  {t.turboTaxSteps.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
                <button
                  type="button"
                  disabled={previewing}
                  onClick={() => void handlePreviewCsv()}
                  className="mt-4 w-full min-h-12 rounded-lg border-2 border-zinc-600 bg-zinc-800 py-3 text-xs font-black uppercase tracking-wider text-white transition-transform active:scale-95 disabled:opacity-50"
                >
                  {previewing ? t.generating : t.previewCsv}
                </button>
                <p className="mt-2 text-[11px] text-zinc-500">{t.previewCsvHint}</p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStep(includesReview ? 2 : 1)}
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

        {step === 4 && (
          <>
            <p className="mb-4 text-sm font-bold text-zinc-300">{t.step3Heading}</p>
            {(generating || readyFile) && (
              <div className="mb-4">
                <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-yellow-500 transition-[width] duration-75 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {progressLabel && (
                  <p className="mt-2 text-xs text-zinc-400">{progressLabel}</p>
                )}
              </div>
            )}
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
                {imageSummary && (
                  <p className="mt-2 text-xs text-zinc-400">{imageSummary}</p>
                )}
                {imageWarning && (
                  <p className="mt-1 text-xs font-bold text-amber-400" role="status">
                    {imageWarning}
                  </p>
                )}
                <p className="mt-2 text-xs text-zinc-500">
                  {sharing ? t.sharing : t.sharingHint}
                </p>
                <button
                  type="button"
                  disabled={sharing}
                  onClick={() => void handleShare(readyFile)}
                  className="mt-6 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95 disabled:opacity-60"
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
