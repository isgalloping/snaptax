"use client";

import type { ComponentProps, KeyboardEvent, MouseEvent } from "react";
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
import { resolveReceiptListVisualState } from "@/lib/receipts/receiptListVisualState";
import { CircularStatusIcon } from "./CircularStatusIcon";
import { StatusPill } from "./StatusPill";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { CoachPulseOverlay } from "@/components/onboarding/CoachPulseOverlay";

interface ReceiptListCardProps {
  receipt: Receipt;
  syncStuck?: boolean;
  uploadInFlight?: boolean;
  highlighted?: boolean;
  ahaCoach?: boolean;
  onAhaCoachDismiss?: () => void;
  onSelect: (receipt: Receipt) => void;
  onResnap: (id: string) => void;
  onRetrySync: (id: string) => void;
  onDelete: (id: string) => void;
}

function duplicateHighlightClass(highlighted: boolean): string {
  return highlighted ? " ring-2 ring-yellow-500 animate-pulse" : "";
}

function listSubtitle(receipt: Receipt, contextLabel: string): string {
  return `${formatReceiptTime(receipt.timestamp, receipt.dataRegion ?? "us")} · ${contextLabel}`;
}

function CardShell({
  children,
  className = "",
  onClick,
  receiptId,
  ariaLabel,
  ...props
}: ComponentProps<"div"> & {
  className?: string;
  onClick?: () => void;
  receiptId?: string;
  ariaLabel?: string;
}) {
  const interactive = onClick != null;
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={interactive ? handleKeyDown : undefined}
      data-receipt-id={receiptId}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      className={`flex w-full items-center gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/90 text-left transition-transform active:scale-[0.98] ${interactive ? "cursor-pointer" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

function ListDeleteButton({
  label,
  merchant,
  onClick,
}: {
  label: string;
  merchant: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} ${merchant}`}
      className="shrink-0 min-h-12 min-w-16 rounded-md bg-red-600 px-2.5 text-[10px] font-black uppercase tracking-wide text-white active:scale-95"
    >
      {label}
    </button>
  );
}

export function ReceiptListCard({
  receipt,
  syncStuck = false,
  uploadInFlight = false,
  highlighted = false,
  ahaCoach = false,
  onAhaCoachDismiss,
  onSelect,
  onResnap,
  onRetrySync,
  onDelete,
}: ReceiptListCardProps) {
  const copy = useUserCopy().home.receiptList;
  const region = receipt.dataRegion ?? "us";
  const timeZone = clientTimeZone();
  const listDate = formatLocalDate(receipt.timestamp, timeZone, region);
  const merchantLabel = receipt.merchant ?? copy.unknownMerchant;

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete(receipt.id);
  };

  if (receipt.isOnboardingDemo && receipt.status === "processing") {
    return (
      <CardShell
        receiptId={receipt.id}
        className={`p-3 ring-2 ring-yellow-500/60 animate-pulse shadow-[0_0_16px_rgba(234,179,8,0.45)]${duplicateHighlightClass(highlighted)}`}
        onClick={() => onSelect(receipt)}
        ariaLabel={`${merchantLabel}, ${receipt.subtitle ?? copy.processing}`}
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
          receiptId={receipt.id}
          className={`p-3${duplicateHighlightClass(highlighted)}`}
          onClick={() => onResnap(receipt.id)}
          ariaLabel={`${merchantLabel}, ${copy.photoMissingTitle}`}
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
          <ListDeleteButton label={copy.delete} merchant={merchantLabel} onClick={handleDelete} />
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-zinc-500" />
        </CardShell>
      );
    }
    const { state, pill } = resolveReceiptListVisualState(receipt, {
      syncStuck,
      uploadInFlight,
    });
    const title = syncStuck
      ? pending
        ? copy.uploadPaused
        : copy.analysisPaused
      : pill === "uploading"
        ? copy.uploading
        : (receipt.merchant ?? copy.processing);
    const contextLabel = syncStuck ? copy.tapToRetry : copy.processing;

    return (
      <CardShell
        receiptId={receipt.id}
        className={`p-3${duplicateHighlightClass(highlighted)}`}
        onClick={() => {
          if (syncStuck) onRetrySync(receipt.id);
          else onSelect(receipt);
        }}
        ariaLabel={`${merchantLabel}, ${title}`}
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
        <div className="flex shrink-0 items-center gap-1">
          <StatusPill variant={pill} />
          <ListDeleteButton label={copy.delete} merchant={merchantLabel} onClick={handleDelete} />
          <ChevronRightIcon className="h-5 w-5 text-zinc-500" />
        </div>
      </CardShell>
    );
  }

  if (receipt.status === "blurry") {
    return (
      <CardShell
        receiptId={receipt.id}
        className={`border-red-900/50 p-3${duplicateHighlightClass(highlighted)}`}
        onClick={() => onSelect(receipt)}
        ariaLabel={`${merchantLabel}, ${copy.receiptBlurry}`}
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
          aria-label={`${copy.resnap} ${merchantLabel}`}
          className="shrink-0 min-h-12 rounded-md bg-red-600 px-2.5 text-[10px] font-black uppercase tracking-wide text-white active:scale-95"
        >
          {copy.resnap}
        </button>
        <ListDeleteButton label={copy.delete} merchant={merchantLabel} onClick={handleDelete} />
      </CardShell>
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
        receiptId={receipt.id}
        className={`p-3 ${demoDone ? "border-l-4 border-l-green-500" : ""}${duplicateHighlightClass(highlighted)}`}
        onClick={() => {
          if (ahaCoach && demoDone) onAhaCoachDismiss?.();
          onSelect(receipt);
        }}
        ariaLabel={`${merchantLabel}, ${tax.label}`}
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
          variant={
            tax.variant === "muted"
              ? "doneMuted"
              : "done"
          }
          doneLabel={tax.label}
        />
        <ChevronRightIcon className="h-5 w-5 text-zinc-500" />
      </div>
    </CardShell>
    </div>
  );
}
