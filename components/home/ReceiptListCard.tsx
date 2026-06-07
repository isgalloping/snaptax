"use client";

import type { ComponentProps } from "react";
import type { Receipt } from "@/lib/types";
import {
  formatCurrencyForRegion,
  formatLocalDate,
  formatReceiptTime,
} from "@/lib/format";
import { clientTimeZone } from "@/lib/time/timeZone";
import { getReceiptListIcon } from "@/lib/receipts/receiptListIcon";
import { irsScheduleLineBadge } from "@/lib/tax/irsScheduleLabel";
import type { ReceiptVisualState } from "@/lib/ui/homeVisual";
import { CircularStatusIcon } from "./CircularStatusIcon";
import { StatusPill } from "./StatusPill";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";

interface ReceiptListCardProps {
  receipt: Receipt;
  syncStuck?: boolean;
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
  onSelect,
  onResnap,
  onRetrySync,
}: ReceiptListCardProps) {
  const region = receipt.dataRegion ?? "us";
  const currency = receipt.currency ?? (region === "eu" ? "EUR" : "USD");
  const timeZone = clientTimeZone();
  const listDate = formatLocalDate(receipt.timestamp, timeZone, region);

  if (receipt.status === "processing") {
    const pending = receipt.pendingUpload === true;
    const { state, pill } = resolveVisualState(receipt, syncStuck);
    const title = syncStuck
      ? pending
        ? "UPLOAD PAUSED"
        : "ANALYSIS PAUSED"
      : "UPLOADING...";
    const contextLabel = syncStuck ? "Tap to retry" : "Processing";

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
            Receipt Blurry
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-400">
            {listSubtitle(receipt, "Need Action")}
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
          Resnap
        </button>
      </div>
    );
  }

  const tax = receipt.taxAmount ?? 0;
  const deductible = receipt.deductible !== false && tax > 0;
  const taxLabel = deductible
    ? `-${formatCurrencyForRegion(tax, currency, region)}`
    : formatCurrencyForRegion(0, currency, region);
  const lineBadge = irsScheduleLineBadge(receipt.category);
  const categoryLabel = receipt.category ?? "OTHER";
  const categoryEmoji = getReceiptListIcon(receipt).emoji;

  return (
    <CardShell className="p-3" onClick={() => onSelect(receipt)}>
      <CircularStatusIcon state="done" emoji={categoryEmoji} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold uppercase text-white">
          {receipt.merchant ?? "Unknown merchant"}
        </p>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-zinc-400">
            {listDate} · {categoryLabel}
          </p>
          <span className="shrink-0 rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200">
            {lineBadge}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <StatusPill variant="done" doneLabel={taxLabel} />
        <ChevronRightIcon className="h-5 w-5 text-zinc-500" />
      </div>
    </CardShell>
  );
}
