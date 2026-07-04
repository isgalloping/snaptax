"use client";

import { useUserCopy } from "@/components/i18n/I18nProvider";
import type { PaymentSuccessState } from "@/lib/billing/paymentSuccessTypes";
import { useDialogEscape } from "@/lib/ui/useDialogEscape";

export interface PaymentSuccessSheetProps {
  state: PaymentSuccessState;
  onClose: () => void;
  onDownloadTaxPack: () => void;
  onRetry: () => void;
  onGotIt: () => void;
  onNotNow: () => void;
}

function SuccessIcon() {
  return (
    <div
      className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-green-500 bg-green-950/40 text-4xl text-green-400"
      aria-hidden
    >
      ✓
    </div>
  );
}

function withSeason(template: string, season: string): string {
  return template.replace("{season}", season);
}

export function PaymentSuccessSheet({
  state,
  onClose,
  onDownloadTaxPack,
  onRetry,
  onGotIt,
  onNotNow,
}: PaymentSuccessSheetProps) {
  const copy = useUserCopy().paymentSuccess;
  const variantCopy = state.variant === "export" ? copy.export : copy.founder;

  useDialogEscape(state.open, onClose);

  if (!state.open) return null;

  const title =
    state.phase === "confirming"
      ? variantCopy.confirmingTitle
      : state.phase === "ready"
        ? state.variant === "export"
          ? withSeason(variantCopy.readyTitle, state.seasonLabel)
          : variantCopy.readyTitle
        : variantCopy.errorTitle;

  const hint =
    state.phase === "confirming"
      ? withSeason(variantCopy.confirmingHint, state.seasonLabel)
      : state.phase === "ready"
        ? state.variant === "founder"
          ? state.founderNumber != null
            ? withSeason(variantCopy.readyHint, state.seasonLabel).replace(
                "{number}",
                String(state.founderNumber),
              )
            : withSeason(
                (variantCopy as typeof copy.founder).readyHintNoNumber,
                state.seasonLabel,
              )
          : variantCopy.readyHint
        : variantCopy.errorHint;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end bg-black/70"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full rounded-t-3xl border-t-4 border-yellow-500 bg-zinc-900 p-6 pb-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-success-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 min-w-12 rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider text-zinc-300 transition-transform active:scale-95"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {state.phase !== "error" && <SuccessIcon />}

        <h2
          id="payment-success-title"
          className="text-center text-xl font-black uppercase tracking-wider text-white"
        >
          {title}
        </h2>
        <p className="mt-4 text-center text-sm leading-relaxed text-zinc-300" aria-live="polite">
          {hint}
        </p>

        {state.phase === "confirming" && (
          <p className="mt-6 text-center text-sm font-bold text-yellow-400" aria-live="polite">
            …
          </p>
        )}

        {state.phase === "ready" && state.variant === "export" && (
          <>
            <button
              type="button"
              onClick={onDownloadTaxPack}
              className="mt-8 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95"
            >
              {copy.export.download}
            </button>
            <button
              type="button"
              onClick={onNotNow}
              className="mt-3 w-full min-h-12 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95"
            >
              {copy.export.notNow}
            </button>
          </>
        )}

        {state.phase === "ready" && state.variant === "founder" && (
          <button
            type="button"
            onClick={onGotIt}
            className="mt-8 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95"
          >
            {copy.founder.gotIt}
          </button>
        )}

        {state.phase === "error" && (
          <>
            <button
              type="button"
              onClick={onRetry}
              className="mt-8 w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95"
            >
              {variantCopy.retry}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full min-h-12 py-3 text-sm font-bold text-zinc-400 transition-transform active:scale-95"
            >
              {variantCopy.close}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
