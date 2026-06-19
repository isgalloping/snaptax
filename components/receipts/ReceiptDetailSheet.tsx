"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Receipt } from "@/lib/types";
import {
  formatCurrencyForRegion,
  formatLocalDate,
  formatReceiptDetailLongDateTime,
} from "@/lib/format";
import { fetchReceiptById, apiReceiptToLocal } from "@/lib/client/receiptApi";
import { isPersistedReceiptId } from "@/lib/receipts/receiptId";
import {
  buildReceiptDetailHero,
  formatPartialMerchant,
  irsScheduleLineBadge,
  resolveReceiptImage,
} from "@/lib/receipts/receiptDetail";
import { receiptCategoryDisplayLabel } from "@/lib/receipts/receiptCategoryDisplay";
import { peekCachedReceiptImageUrl } from "@/lib/client/receiptImageCache";
import { clientTimeZone } from "@/lib/time/timeZone";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { ReceiptImageZoomViewer } from "@/components/receipts/ReceiptImageZoomViewer";
import { ReceiptDetailStepper } from "@/components/receipts/ReceiptDetailStepper";
import { ReceiptCaptureSection } from "@/components/receipts/ReceiptCaptureSection";
import { ReceiptCaptureActions } from "@/components/receipts/ReceiptCaptureActions";
import { ReceiptDeleteConfirmSheet } from "@/components/receipts/ReceiptDeleteConfirmSheet";

interface ReceiptDetailSheetProps {
  receipt: Receipt;
  syncStuck?: boolean;
  onClose: () => void;
  onResnap: (id: string) => void;
  onDeleteReceipt: (id: string) => Promise<void>;
  onRetrySync?: (id: string) => void;
  onReceiptUpdate?: (receipt: Receipt) => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-800 py-3 last:border-b-0">
      <span className="text-sm font-bold text-zinc-400">{label}</span>
      <span className="text-right text-sm font-bold text-white">{value}</span>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs font-black uppercase tracking-wide text-white">
      {category}
    </span>
  );
}

export function ReceiptDetailSheet({
  receipt: initialReceipt,
  syncStuck = false,
  onClose,
  onResnap,
  onDeleteReceipt,
  onRetrySync,
  onReceiptUpdate,
}: ReceiptDetailSheetProps) {
  const copy = useUserCopy().receiptDetail;
  const [receipt, setReceipt] = useState(initialReceipt);
  const [imageSrc, setImageSrc] = useState<string | null>(() =>
    peekCachedReceiptImageUrl(initialReceipt.id),
  );
  const [imageMissing, setImageMissing] = useState(false);
  const [imageOffline, setImageOffline] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const revokeRef = useRef<(() => void) | undefined>(undefined);
  const onReceiptUpdateRef = useRef(onReceiptUpdate);
  onReceiptUpdateRef.current = onReceiptUpdate;

  const hero = buildReceiptDetailHero(receipt, copy.hero);
  const region = receipt.dataRegion ?? "us";
  const currency = receipt.currency ?? (region === "eu" ? "EUR" : "USD");
  const timeZone = clientTimeZone();
  const dateCaptured = formatLocalDate(receipt.timestamp, timeZone, region);
  const dateCapturedLong = formatReceiptDetailLongDateTime(
    receipt.timestamp,
    timeZone,
    region,
  );

  useEffect(() => {
    setReceipt(initialReceipt);
  }, [initialReceipt]);

  useEffect(() => {
    if (
      !navigator.onLine ||
      receipt.status === "processing" ||
      receipt.isOnboardingDemo ||
      !isPersistedReceiptId(receipt.id)
    ) {
      return;
    }
    void fetchReceiptById(receipt.id)
      .then((remote) => {
        const updated = apiReceiptToLocal(remote);
        setReceipt((prev) => ({ ...prev, ...updated }));
        onReceiptUpdateRef.current?.(updated);
      })
      .catch(() => {});
  }, [receipt.id, receipt.status]);

  useEffect(() => {
    let cancelled = false;
    const cached = peekCachedReceiptImageUrl(receipt.id);
    if (cached) {
      setImageSrc((prev) => prev ?? cached);
      setImageMissing(false);
      setImageOffline(false);
    }
    void resolveReceiptImage(receipt).then((resolved) => {
      if (cancelled) {
        if (resolved.kind === "local") resolved.revoke?.();
        return;
      }
      revokeRef.current?.();
      revokeRef.current =
        resolved.kind === "local" ? resolved.revoke : undefined;
      if (resolved.kind === "local" || resolved.kind === "remote") {
        setImageSrc(resolved.src);
        setImageMissing(false);
        setImageOffline(false);
        return;
      }
      setImageSrc(null);
      setImageOffline(resolved.kind === "offline-placeholder");
      setImageMissing(resolved.kind === "missing");
    });
    return () => {
      cancelled = true;
      revokeRef.current?.();
      revokeRef.current = undefined;
    };
  }, [receipt.id, receipt.hasRemoteImage]);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = dragStartY.current;
    const end = e.changedTouches[0]?.clientY;
    dragStartY.current = null;
    if (start != null && end != null && end - start > 80) {
      onClose();
    }
  };

  const handleResnap = useCallback(() => {
    onClose();
    onResnap(receipt.id);
  }, [onClose, onResnap, receipt.id]);

  const runDelete = useCallback(async () => {
    setDeleteBusy(true);
    try {
      await onDeleteReceipt(receipt.id);
      onClose();
    } finally {
      setDeleteBusy(false);
      setShowDeleteConfirm(false);
    }
  }, [onClose, onDeleteReceipt, receipt.id]);

  const handleDeleteClick = useCallback(() => {
    if (hero.kind === "done") {
      setShowDeleteConfirm(true);
      return;
    }
    void runDelete();
  }, [hero.kind, runDelete]);

  const showResnap = hero.kind === "processing" || hero.kind === "blurry";

  const openZoom = useCallback(() => {
    if (imageSrc) setFullscreen(true);
  }, [imageSrc]);

  const totalLabel =
    receipt.amount != null
      ? formatCurrencyForRegion(receipt.amount, currency, region)
      : "—";

  const incomeTaxYearLabel =
    receipt.incomeTaxYear != null
      ? String(receipt.incomeTaxYear)
      : copy.taxYearUnknown;

  const processingTitle =
    receipt.photoMissing && receipt.pendingUpload
      ? copy.photoMissing
      : receipt.pendingUpload && syncStuck
        ? copy.uploadPaused
        : syncStuck
          ? copy.analysisPaused
          : copy.calculating;

  const stepperPhase =
    hero.kind === "done"
      ? "done"
      : hero.kind === "blurry"
        ? "blurry"
        : "processing";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end bg-black/70"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="flex max-h-[75vh] w-full flex-col rounded-t-3xl border-t-4 border-yellow-500 bg-black"
          role="dialog"
          aria-labelledby="receipt-detail-title"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex flex-col items-center pt-3">
            <div className="h-1.5 w-12 rounded-full bg-zinc-600" aria-hidden />
          </div>

          <div className="flex items-center justify-end px-4 pb-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex min-h-16 min-w-16 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-900 text-xl font-black text-white active:scale-95"
              aria-label={copy.close}
            >
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
            <section className="mb-6 text-center">
              {hero.kind === "processing" && (
                <>
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-[0_0_24px_rgba(234,179,8,0.45)]"
                    aria-hidden
                  >
                    🧾
                  </div>
                  <p
                    id="receipt-detail-title"
                    className="text-lg font-black text-yellow-400"
                  >
                    {processingTitle}
                  </p>
                  {!syncStuck && (
                    <p className="mt-2 text-sm text-zinc-400">
                      {copy.mayTakeSeconds}
                    </p>
                  )}
                  <ReceiptDetailStepper phase={stepperPhase} />
                  <div className="mx-auto mt-6 max-w-sm rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-300">
                    {copy.dateCapturedLong.replace("{date}", dateCapturedLong)}
                  </div>
                  {syncStuck && onRetrySync && !receipt.photoMissing && (
                    <button
                      type="button"
                      onClick={() => onRetrySync(receipt.id)}
                      className="mt-6 min-h-14 w-full rounded-xl border-2 border-yellow-500 bg-zinc-900 py-3 text-base font-black uppercase text-yellow-400 active:scale-95"
                    >
                      {receipt.pendingUpload
                        ? copy.retryUpload
                        : copy.retryAnalysis}
                    </button>
                  )}
                  {receipt.photoMissing && receipt.pendingUpload && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onResnap(receipt.id);
                      }}
                      className="mt-6 min-h-14 w-full rounded-xl border-2 border-yellow-500 bg-zinc-900 py-3 text-base font-black uppercase text-yellow-400 active:scale-95"
                    >
                      {copy.resnap}
                    </button>
                  )}
                </>
              )}

              {hero.kind === "blurry" && (
                <>
                  <p
                    id="receipt-detail-title"
                    className="text-2xl font-black text-red-400"
                  >
                    {copy.blurryTitle}
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    {copy.blurryBody}
                  </p>
                  <ReceiptDetailStepper phase={stepperPhase} />
                </>
              )}

              {hero.kind === "done" && (
                <>
                  <p
                    id="receipt-detail-title"
                    className={`text-4xl font-black tracking-tight ${
                      hero.incomeForm
                        ? "text-yellow-400"
                        : hero.muted
                          ? "text-zinc-500"
                          : "text-green-400"
                    }`}
                  >
                    {hero.savedLabel}
                  </p>
                  <p
                    className={`mt-2 text-sm font-bold ${
                      hero.incomeForm
                        ? "text-yellow-400"
                        : hero.muted
                          ? "text-zinc-500"
                          : "text-green-400"
                    }`}
                  >
                    {hero.subtitle}
                  </p>
                </>
              )}
            </section>

            {hero.kind === "blurry" && (
              <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {copy.partialDetails}
                </h3>
                <p className="text-sm font-bold text-zinc-300">
                  {copy.possibleMerchant.replace(
                    "{merchant}",
                    formatPartialMerchant(receipt.merchant, copy),
                  )}
                </p>
                <p className="mt-1 text-sm font-bold text-zinc-300">
                  {copy.dateCaptured.replace("{date}", dateCaptured)}
                </p>
              </section>
            )}

            {hero.kind === "done" && (
              <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-950 px-4">
                {hero.incomeForm ? (
                  <>
                    <DetailRow
                      label={copy.formType}
                      value={receipt.category ?? "—"}
                    />
                    <DetailRow label={copy.payer} value={receipt.merchant ?? "—"} />
                    <DetailRow label={copy.taxYear} value={incomeTaxYearLabel} />
                    <DetailRow label={copy.totalAmount} value={totalLabel} />
                  </>
                ) : (
                  <>
                    <DetailRow label={copy.merchant} value={receipt.merchant ?? "—"} />
                    <DetailRow label={copy.totalAmount} value={totalLabel} />
                    <div className="flex items-start justify-between gap-4 border-b border-zinc-800 py-3">
                      <span className="text-sm font-bold text-zinc-400">{copy.category}</span>
                      <CategoryBadge
                        category={receiptCategoryDisplayLabel(receipt.category)}
                      />
                    </div>
                    <DetailRow
                      label={copy.irsLine}
                      value={irsScheduleLineBadge(receipt.category)}
                    />
                  </>
                )}
              </section>
            )}

            {(hero.kind === "done" ||
              hero.kind === "blurry" ||
              hero.kind === "processing") && (
              <div className="space-y-4">
                <ReceiptCaptureSection
                  title={
                    hero.kind === "blurry"
                      ? copy.blurryPreview
                      : copy.originalCapture
                  }
                  imageSrc={imageSrc}
                  imageMissing={imageMissing}
                  imageOffline={imageOffline}
                  hint={
                    hero.kind === "blurry" ? copy.tapToEnlarge : copy.tapToZoom
                  }
                  onZoom={openZoom}
                  actions={
                    imageSrc ? (
                      <ReceiptCaptureActions
                        showResnap={showResnap}
                        showDelete={!receipt.isOnboardingDemo}
                        busy={deleteBusy}
                        onDelete={handleDeleteClick}
                        onResnap={showResnap ? handleResnap : undefined}
                      />
                    ) : undefined
                  }
                />
                {hero.kind === "processing" && (
                  <p className="text-center text-[10px] font-bold leading-relaxed text-zinc-500">
                    {copy.encryptionNote}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {fullscreen && imageSrc && (
        <ReceiptImageZoomViewer
          src={imageSrc}
          onClose={() => setFullscreen(false)}
        />
      )}

      <ReceiptDeleteConfirmSheet
        open={showDeleteConfirm}
        busy={deleteBusy}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => void runDelete()}
      />
    </>
  );
}
