"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Receipt } from "@/lib/types";
import { formatCurrencyForRegion } from "@/lib/format";
import { fetchReceiptById, apiReceiptToLocal } from "@/lib/client/receiptApi";
import {
  buildReceiptDetailHero,
  resolveReceiptImage,
} from "@/lib/receipts/receiptDetail";
import { formatReceiptDetailDateTime } from "@/lib/format";
import { ReceiptImageFullscreen } from "@/components/receipts/ReceiptImageFullscreen";

interface ReceiptDetailSheetProps {
  receipt: Receipt;
  onClose: () => void;
  onResnap: (id: string) => void;
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

export function ReceiptDetailSheet({
  receipt: initialReceipt,
  onClose,
  onResnap,
  onReceiptUpdate,
}: ReceiptDetailSheetProps) {
  const [receipt, setReceipt] = useState(initialReceipt);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageMissing, setImageMissing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const revokeRef = useRef<(() => void) | undefined>(undefined);

  const hero = buildReceiptDetailHero(receipt);
  const region = receipt.dataRegion ?? "us";
  const currency = receipt.currency ?? (region === "eu" ? "EUR" : "USD");

  useEffect(() => {
    setReceipt(initialReceipt);
  }, [initialReceipt]);

  useEffect(() => {
    if (!navigator.onLine || receipt.status === "processing") return;
    void fetchReceiptById(receipt.id)
      .then((remote) => {
        const updated = apiReceiptToLocal(remote);
        setReceipt((prev) => ({ ...prev, ...updated }));
        onReceiptUpdate?.(updated);
      })
      .catch(() => {});
  }, [receipt.id, receipt.status, onReceiptUpdate]);

  useEffect(() => {
    let cancelled = false;
    void resolveReceiptImage(receipt).then(({ src, revoke }) => {
      if (cancelled) {
        revoke?.();
        return;
      }
      revokeRef.current?.();
      revokeRef.current = revoke;
      setImageSrc(src);
      setImageMissing(!src);
    });
    return () => {
      cancelled = true;
      revokeRef.current?.();
      revokeRef.current = undefined;
    };
  }, [receipt]);

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

  const totalLabel =
    receipt.amount != null
      ? formatCurrencyForRegion(receipt.amount, currency, region)
      : "—";

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
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
            <section className="mb-8 text-center">
              {hero.kind === "processing" && (
                <>
                  <div
                    className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"
                    aria-hidden
                  />
                  <p
                    id="receipt-detail-title"
                    className="text-lg font-black text-yellow-400"
                  >
                    Calculating your deductions...
                  </p>
                </>
              )}

              {hero.kind === "blurry" && (
                <>
                  <p
                    id="receipt-detail-title"
                    className="text-2xl font-black text-red-400"
                  >
                    Receipt too blurry to read
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Snap again in good light, hold steady
                  </p>
                  <button
                    type="button"
                    onClick={handleResnap}
                    className="mt-6 min-h-16 w-full rounded-xl bg-yellow-500 py-3 text-lg font-black uppercase text-black active:scale-95"
                  >
                    Resnap receipt
                  </button>
                </>
              )}

              {hero.kind === "done" && (
                <>
                  <p
                    id="receipt-detail-title"
                    className={`text-4xl font-black tracking-tight ${
                      hero.muted ? "text-zinc-400" : "text-yellow-400"
                    }`}
                  >
                    {hero.savedLabel}
                  </p>
                  <p
                    className={`mt-2 text-sm font-bold ${
                      hero.muted ? "text-zinc-500" : "text-green-400"
                    }`}
                  >
                    {hero.subtitle}
                  </p>
                </>
              )}
            </section>

            <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-950 px-4">
              <DetailRow
                label="Merchant"
                value={receipt.merchant ?? "—"}
              />
              <DetailRow
                label="Date"
                value={formatReceiptDetailDateTime(receipt.timestamp, region)}
              />
              <DetailRow label="Total (tax incl.)" value={totalLabel} />
            </section>

            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                Original receipt
              </h3>
              {imageSrc ? (
                <button
                  type="button"
                  onClick={() => setFullscreen(true)}
                  className="block w-full overflow-hidden rounded-xl border border-zinc-600 active:scale-[0.99]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt="Receipt thumbnail"
                    className="max-h-48 w-full object-cover"
                  />
                </button>
              ) : (
                <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-4 text-center text-sm font-bold text-zinc-500">
                  {imageMissing
                    ? "Photo not on this device"
                    : "Loading photo…"}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {fullscreen && imageSrc && (
        <ReceiptImageFullscreen
          src={imageSrc}
          onClose={() => setFullscreen(false)}
        />
      )}
    </>
  );
}
