"use client";

import type { ReceiptVisualState } from "@/lib/ui/homeVisual";

const CONFIG: Record<
  ReceiptVisualState,
  { bg: string; content: string; spin?: boolean }
> = {
  uploading: { bg: "bg-yellow-500/20", content: "☁️" },
  analyzing: { bg: "bg-blue-500/20", content: "⚙️", spin: true },
  paused: { bg: "bg-yellow-500/30", content: "⚠️" },
  done: { bg: "bg-green-500/20", content: "🧾" },
  blurry: { bg: "bg-red-500/20", content: "❌" },
};

export function CircularStatusIcon({
  state,
  emoji,
}: {
  state: ReceiptVisualState;
  emoji?: string;
}) {
  const cfg = CONFIG[state];
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}
      aria-hidden
    >
      <span
        className={
          cfg.spin ? "inline-block animate-spin text-base" : "text-base"
        }
      >
        {state === "done" && emoji ? emoji : cfg.content}
      </span>
    </span>
  );
}
