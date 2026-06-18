"use client";

import type { ComponentProps } from "react";
import type { Receipt } from "@/lib/types";
import {
  formatLocalDate,
  formatReceiptTime,
} from "@/lib/format";
import { clientTimeZone } from "@/lib/time/timeZone";
import { getReceiptListIcon } from "@/lib/receipts/receiptListIcon";
import { irsScheduleLineBadge } from "@/lib/tax/irsScheduleLabel";
import {
  receiptCategoryDisplayLabel,
  receiptTaxDisplay,
} from "@/lib/receipts/receiptCategoryDisplay";
import type { ReceiptVisualState } from "@/lib/ui/homeVisual";
import { CircularStatusIcon } from "./CircularStatusIcon";
import { StatusPill } from "./StatusPill";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { CoachPulseOverlay } from "@/components/onboarding/CoachPulseOverlay";

interface ReceiptListCardProps {
  receipt: Receipt;
  syncStuck?: boolean;
  ahaCoach?: boolean;
  onAhaCoachDismiss?: () => void;
  onSelect: (receipt: Receipt) => void;
  onResnap: (id: string) => void;
  onRetrySync: (id: string) => void;
}

function listSubtitle(receipt: Receipt, contextLabel: string): string {
  return `${formatReceiptTime(receipt.timestamp, receipt.dataRegion ?? "us")} · ${contextLabel}`;
}

function resolveVisualState(
  receipt: Receipt,
  syncStuck: boolean,
): {
  state: ReceiptVisualState;
  pill: "analyzing" | "uploading" | "paused" | "none";
} {
  if (receipt.status !== "processing") {
    return { state: "done", pill: "none" };
  }
  if (syncStuck) {
    return { state: "paused", pill: "paused" };
  }
  if (receipt.pendingUpload) {
    return { state: "uploading", pill: "uploading" };
  }
  return { state: "analyzing", pill: "analyzing" };
}

function CardShell({
  children,
  className = "",
  ...props
}: ComponentProps<"button"> & { className?: string }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/90 text-left transition-transform active:scale-[0.98] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ReceiptListCard({
  receipt,
  syncStuck = false,
  ahaCoach = false,
  onAhaCoachDismiss,
  onSelect,
  onResnap,
  onRetrySync,
}: ReceiptListCardProps) {
  const copy = useUserCopy().home.receiptList;
  const region = receipt.dataRegion ?? "us";
  const timeZone = clientTimeZone();
  const listDate = formatLocalDate(receipt.timestamp, timeZone, region);

  if (receipt.isOnboardingDemo && receipt.status === "processing") {
    return (
      <CardShell
        className="p-3 ring-2 ring-yellow-500/60 animate-pulse shadow-[0_0_16px_rgba(234,179,8,0.45)]"
        onClick={() => onSelect(receipt)}
      >
        <CircularStatusIcon state="analyzing" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold uppercase text-yellow-400">
            {receipt.merchant ?? copy.unknownMerchant}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-400">
            {receipt.subtitle ?? copy.processing}
          </p>
        </div>
        <ChevronRightIcon className="h-5 w-5 shrink-0 text-zinc-500" />
      </CardShell>
    );
  }

  if (receipt.status === "processing") {
    const pending = receipt.pendingUpload === true;
    if (receipt.photoMissing && pending) {
      return (
        <CardShell
          className="p-3"
          onClick={() => onResnap(receipt.id)}
        >
          <CircularStatusIcon state="paused" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold uppercase text-yellow-400">
              {receipt.merchant ?? copy.unknownMerchant}
            </p>
            <p className="mt-0.5 truncate text-xs text-zinc-400">
              {listSubtitle(receipt, copy.photoMissingSubtitle)}
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {copy.photoMissingTitle}
          </span>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-zinc-500" />
        </CardShell>
      );
    }
    const { state, pill } = resolveVisualState(receipt, syncStuck);
    const title = syncStuck
      ? pending
        ? copy.uploadPaused
        : copy.analysisPaused
      : copy.uploading;
    const contextLabel = syncStuck ? copy.tapToRetry : copy.processing;

    return (
      <CardShell
        className="p-3"
        onClick={() => {
          if (syncStuck) onRetrySync(receipt.id);
          else onSelect(receipt);
        }}
      >
        <CircularStatusIcon state={state} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold uppercase text-yellow-500">
            {title}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-400">
            {listSubtitle(receipt, contextLabel)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <StatusPill variant={pill} />
          <ChevronRightIcon className="h-5 w-5 text-zinc-500" />
        </div>
      </CardShell>
    );
  }

  if (receipt.status === "blurry") {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(receipt)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(receipt);
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-red-900/50 bg-zinc-800/90 p-3 text-left transition-transform active:scale-[0.98]"
      >
        <CircularStatusIcon state="blurry" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold uppercase text-red-500">
            {copy.receiptBlurry}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-400">
            {listSubtitle(receipt, copy.needAction)}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onResnap(receipt.id);
          }}
          className="shrink-0 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white active:scale-95"
        >
          {copy.resnap}
        </button>
      </div>
    );
  }

  const tax = receiptTaxDisplay(receipt);
  const lineBadge = irsScheduleLineBadge(receipt.category);
  const categoryEmoji = getReceiptListIcon(receipt).emoji;
  const demoDone = receipt.isOnboardingDemo && receipt.status === "done";

  return (
    <div className="relative">
      {ahaCoach && demoDone && <CoachPulseOverlay />}
      <CardShell
        className={`p-3 ${demoDone ? "border-l-4 border-l-green-500" : ""}`}
        onClick={() => {
          if (ahaCoach && demoDone) onAhaCoachDismiss?.();
          onSelect(receipt);
        }}
      >
      <CircularStatusIcon state="done" emoji={categoryEmoji} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold uppercase text-white">
          {receipt.merchant ?? copy.unknownMerchant}
        </p>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs ${demoDone ? "font-bold text-green-400" : "text-zinc-400"}`}
          >
            {demoDone
              ? (receipt.subtitle ?? "COMPLETE")
              : `${listDate} · ${receiptCategoryDisplayLabel(receipt.category)}`}
          </p>
          <span className="shrink-0 rounded bg-zinc-700/80 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
            {lineBadge}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <StatusPill
          variant={tax.variant === "deductible" ? "done" : "doneMuted"}
          doneLabel={tax.label}
        />
        <ChevronRightIcon className="h-5 w-5 text-zinc-500" />
      </div>
    </CardShell>
    </div>
  );
}
