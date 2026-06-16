"use client";

import { useEffect } from "react";

interface ExportEmptyTipProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

export function ExportEmptyTip({
  message,
  onDismiss,
  durationMs = 5000,
}: ExportEmptyTipProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss, durationMs]);

  return (
    <p
      role="status"
      className="animate-export-empty-tip mb-3 w-full rounded-xl border-2 border-yellow-500/70 bg-yellow-950/60 px-4 py-3 text-center text-sm font-bold leading-snug text-yellow-200"
    >
      {message}
    </p>
  );
}
