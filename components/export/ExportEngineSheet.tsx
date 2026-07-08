"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Receipt } from "@/lib/types";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  incomeFormsInTaxYear,
  taxYearDeductions,
  receiptsInTaxYear,
} from "@/lib/tax/taxYearStats";
import {
  exportPickerTaxYears,
  pickDefaultExportTaxYear,
} from "@/lib/tax/exportGate";
import { filingTaxYearForSeason } from "@/lib/tax/season";
import { receiptsNeedingExportReview } from "@/lib/tax/exportReview";
import { formatCurrency } from "@/lib/format";
import { clientTimeZone } from "@/lib/time/timeZone";
import { runLocalTaxExport } from "@/lib/client/runLocalTaxExport";
import {
  exportTaxPack,
  type ExportFormat,
  type ExportTaxPackMeta,
} from "@/lib/client/authApi";
import {
  exportPreviewCsvFilename,
  exportShareTitle,
} from "@/lib/export/exportFilenames";
import {
  canShareTaxPackFile,
  downloadTaxPackFile,
  shareTaxPackFile,
} from "@/lib/export/shareTaxPack";
import { buildLocalTurboTaxCsv } from "@/lib/export/buildLocalTurboTaxCsv";
import { setPendingIncomeCapture } from "@/lib/export/incomeCapture";
import type { IncomeCaptureKind } from "@/lib/export/incomeCapture";
import { ExportCategoryReview } from "@/components/export/ExportCategoryReview";

type Step = 1 | 2 | 3 | 4;

interface ExportEngineSheetProps {
  receipts: Receipt[];
  currentSeason: string;
  onClose: () => void;
  onPreExportPrepare?: () => Promise<void | Receipt[]>;
  onExported?: () => void | Promise<void>;
  onPaymentRequired?: () => void;
  onReceiptUpdated?: (receipt: Receipt) => void;
  onSnap1099?: (kind: IncomeCaptureKind) => void;
}

const PROGRESS_TICK_MS = 16;
const FAST_RAMP_MS = 300;

export function ExportEngineSheet({
  receipts,
  currentSeason,
  onClose,
  onPreExportPrepare,
  onExported,
  onPaymentRequired,
  onReceiptUpdated,
  onSnap1099,
}: ExportEngineSheetProps) {
  const { copy } = useI18n();
  const t = copy.exportEngine;
  const timeZone = clientTimeZone();
  const [activeReceipts, setActiveReceipts] = useState(receipts);

  useEffect(() => {
    setActiveReceipts(receipts);
  }, [receipts]);

  const years = useMemo(
    () => exportPickerTaxYears(activeReceipts, timeZone, currentSeason),
    [activeReceipts, timeZone, currentSeason],
  );

  const [step, setStep] = useState<Step>(1);
  const [taxYear, setTaxYear] = useState<number>(() =>
    pickDefaultExportTaxYear(activeReceipts, timeZone, currentSeason),
  );
  const [step1Hint, setStep1Hint] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>("cpa_pdf");
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [readyFile, setReadyFile] = useState<File | null>(null);
  const [exportMeta, setExportMeta] = useState<ExportTaxPackMeta | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const autoSharedRef = useRef(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const yearReceipts = receiptsInTaxYear(activeReceipts, taxYear, timeZone);
  const yearDeductions = taxYearDeductions(activeReceipts, taxYear, timeZone);
  const incomeFormCount = incomeFormsInTaxYear(activeReceipts, taxYear, timeZone);
  const reviewReceipts = useMemo(
    () => receiptsNeedingExportReview(yearReceipts),
    [yearReceipts],
  );
  const includesReview = reviewReceipts.length > 0;
  const totalSteps = includesReview ? 4 : 3;
  const formatStep: Step = includesReview ? 3 : 2;
  const generateStep: Step = includesReview ? 4 : 3;
  const canContinueStep1 = yearReceipts.length > 0;

  useEffect(() => {
    if (receiptsInTaxYear(activeReceipts, taxYear, timeZone).length > 0) return;
    const next = pickDefaultExportTaxYear(
      activeReceipts,
      timeZone,
      currentSeason,
    );
    if (receiptsInTaxYear(activeReceipts, next, timeZone).length > 0) {
      setTaxYear(next);
      setStep1Hint(null);
    }
  }, [activeReceipts, taxYear, timeZone, currentSeason]);

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
        setProgressLabel(
          selectedFormat === "cpa_pdf"
            ? t.progressBuildingPdf
            : t.progressFetchingImages,
        );
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
    setShareStatus(null);
    try {
      const result = await shareTaxPackFile(
        file,
        exportShareTitle(taxYear),
        copy.settings.export.shareText,
      );
      if (result === "unsupported") {
        setShareStatus(t.shareUnsupportedHint);
      } else if (result === "failed") {
        setShareStatus(t.shareFailedHint);
      } else if (result === "cancelled") {
        setShareStatus(t.sharingHint);
      }
    } finally {
      setSharing(false);
    }
  };

  useEffect(() => {
    if (!readyFile || autoSharedRef.current) return;
    if (!canShareTaxPackFile(readyFile)) return;
    autoSharedRef.current = true;
    void handleShare(readyFile);
  }, [readyFile]);

  const handleSaveToPhone = (file: File) => {
    downloadTaxPackFile(file);
    setShareStatus(t.savedToPhoneHint);
  };

  const goToFormatStep = () => {
    setStep(formatStep);
  };

  const handleContinueFromYear = () => {
    if (yearReceipts.length === 0) {
      setStep1Hint(t.noDeductibleReceipts);
      return;
    }
    setStep1Hint(null);
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
      const csv = buildLocalTurboTaxCsv(activeReceipts, taxYear, timeZone);
      const file = new File(
        [csv],
        exportPreviewCsvFilename(taxYear),
        { type: "text/csv" },
      );
      const result = await shareTaxPackFile(
        file,
        exportShareTitle(taxYear, "Preview"),
        copy.settings.export.shareText,
      );
      if (result === "unsupported") {
        downloadTaxPackFile(file);
        setShareStatus(t.savedToPhoneHint);
      } else if (result === "failed") {
        setErrorMessage(t.shareFailedHint);
      }
    } catch {
      setErrorMessage(copy.settings.export.failed);
    } finally {
      setPreviewing(false);
    }
  };

  const handleGenerate = async () => {
    setErrorMessage(null);
    autoSharedRef.current = false;
    setShareStatus(null);
    if (!navigator.onLine) {
      setErrorMessage(copy.settings.export.offline);
      return;
    }
    setGenerating(true);
    setReadyFile(null);
    setExportMeta(null);
    setStep(generateStep);
    try {
      let receiptsForExport = activeReceipts;
      if (onPreExportPrepare) {
        const merged = await onPreExportPrepare();
        if (merged && merged.length > 0) {
          receiptsForExport = merged;
          setActiveReceipts(merged);
        }
      }
      const exportReceiptCount = receiptsInTaxYear(
        receiptsForExport,
        taxYear,
        timeZone,
      ).length;
      startProgressRamp(format, exportReceiptCount);
      const taxYearStr = String(taxYear);
      const result =
        format === "csv" || format === "txf"
          ? await runLocalTaxExport({
              receipts: receiptsForExport,
              taxYear,
              timeZone,
              format,
            })
          : await exportTaxPack({
              taxYear: taxYearStr,
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
        } else if (err.message === "PDF_GENERATION_FAILED") {
          setErrorMessage(t.pdfFailed);
        } else if (err.message === "EXPORT_TIMEOUT") {
          setErrorMessage(t.exportTimeout);
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
      : format === "txf"
        ? t.formatTxfTitle
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
                .replace("{step}", String(step))
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
            <p className="mb-1 text-sm font-bold text-zinc-300">{t.step1Heading}</p>
            <p className="mb-4 text-xs leading-relaxed text-zinc-500">
              {t.step1SeasonHint
                .replace("{season}", currentSeason)
                .replace("{year}", String(filingTaxYearForSeason(currentSeason)))}
            </p>
            <div className="space-y-3">
              {years.map((year) => {
                const count = receiptsInTaxYear(activeReceipts, year, timeZone).length;
                const deductions = taxYearDeductions(activeReceipts, year, timeZone);
                const selected = taxYear === year;
                const disabled = count === 0;
                return (
                  <button
                    key={year}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setTaxYear(year);
                      setStep1Hint(null);
                    }}
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
                    {incomeFormCount > 0 && taxYear === year && (
                      <p className="mt-1 text-xs text-yellow-500/90">
                        {t.incomeFormsLabel.replace(
                          "{count}",
                          String(incomeFormCount),
                        )}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
            {!canContinueStep1 && (
              <p className="mt-4 rounded-xl border-2 border-red-600 bg-red-950/40 px-4 py-3 text-sm font-bold text-red-400">
                {step1Hint ?? t.noDeductibleReceipts}
              </p>
            )}
            <button
              type="button"
              onClick={handleContinueFromYear}
              className={`mt-6 w-full min-h-16 rounded-xl border-4 py-4 text-lg font-black uppercase tracking-wider transition-transform active:scale-95 ${
                canContinueStep1
                  ? "border-white bg-yellow-500 text-black"
                  : "cursor-not-allowed border-zinc-600 bg-zinc-800 text-zinc-500"
              }`}
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

        {step === formatStep && (
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
              <button
                type="button"
                onClick={() => setFormat("txf")}
                className={`w-full min-h-[88px] rounded-xl border-2 p-4 text-left transition-transform active:scale-95 ${
                  format === "txf"
                    ? "border-yellow-500 bg-yellow-950"
                    : "border-zinc-600 bg-zinc-800"
                }`}
              >
                <p className="text-sm font-black uppercase tracking-wider text-white">
                  {format === "txf" ? "✓ " : ""}
                  {t.formatTxfTitle}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  {t.formatTxfHint}
                </p>
              </button>
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

            <div className="mt-4 rounded-xl border-2 border-zinc-700 bg-zinc-950 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-yellow-400">
                {t.snap1099Title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {t.snap1099Hint}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingIncomeCapture("1099-NEC");
                    onClose();
                    onSnap1099?.("1099-NEC");
                  }}
                  className="min-h-12 rounded-lg border-2 border-yellow-500 bg-yellow-950 py-3 text-[11px] font-black uppercase tracking-wider text-yellow-400 transition-transform active:scale-95"
                >
                  {t.snap1099NecButton}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingIncomeCapture("1099-K");
                    onClose();
                    onSnap1099?.("1099-K");
                  }}
                  className="min-h-12 rounded-lg border-2 border-zinc-600 bg-zinc-800 py-3 text-[11px] font-black uppercase tracking-wider text-white transition-transform active:scale-95"
                >
                  {t.snap1099KButton}
                </button>
              </div>
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

        {step === generateStep && (
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
                <p className="mt-2 text-xs text-zinc-500" role="status">
                  {sharing
                    ? t.sharing
                    : shareStatus ??
                      (canShareTaxPackFile(readyFile)
                        ? t.sharingHint
                        : t.shareUnsupportedHint)}
                </p>
                <button
                  type="button"
                  onClick={() => handleSaveToPhone(readyFile)}
                  className="mt-6 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95"
                >
                  {t.saveToPhone}
                </button>
                <button
                  type="button"
                  disabled={sharing || !canShareTaxPackFile(readyFile)}
                  onClick={() => void handleShare(readyFile)}
                  className="mt-3 w-full min-h-14 rounded-xl border-2 border-zinc-600 bg-zinc-800 py-3 text-sm font-black uppercase tracking-wider text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
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
