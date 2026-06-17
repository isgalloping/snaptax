"use client";

import type { ReactNode } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";

interface OverlayShellProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function OverlayShell({ title, onBack, children, footer }: OverlayShellProps) {
  const back = useUserCopy().home.overlays.back;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black text-white">
      <header className="flex shrink-0 items-center border-b-4 border-yellow-500 bg-zinc-900 p-4">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-16 min-w-16 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider transition-transform active:scale-95"
        >
          {back}
        </button>
        <h1 className="ml-4 text-lg font-black uppercase tracking-wider">{title}</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      {footer && <div className="shrink-0 border-t border-zinc-800 p-4">{footer}</div>}
    </div>
  );
}
