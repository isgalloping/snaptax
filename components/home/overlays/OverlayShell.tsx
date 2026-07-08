"use client";

import type { ReactNode } from "react";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { useSwipeBack } from "@/lib/client/useSwipeBack";

interface OverlayShellProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** When false, header is title-only (e.g. privacy trust + footer Got it). Default true. */
  showBack?: boolean;
}

export function OverlayShell({
  title,
  onBack,
  children,
  footer,
  showBack = true,
}: OverlayShellProps) {
  const back = useUserCopy().home.overlays.back;
  const swipeRef = useSwipeBack({ onBack });

  return (
    <div
      ref={swipeRef}
      className="absolute inset-0 z-50 flex flex-col bg-black text-white"
    >
      <header className="shrink-0 border-b-4 border-yellow-500 bg-zinc-900 px-2 py-3">
        {showBack ? (
          <div className="grid grid-cols-[4rem_1fr_4rem] items-center gap-1">
            <button
              type="button"
              onClick={onBack}
              aria-label={back}
              className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 text-3xl font-black leading-none text-zinc-200 transition-transform active:scale-95"
            >
              <span aria-hidden>‹</span>
            </button>
            <h1 className="text-center text-base font-black uppercase leading-tight tracking-wider">
              {title}
            </h1>
            <div aria-hidden className="h-16 w-16" />
          </div>
        ) : (
          <h1 className="px-4 py-2 text-center text-lg font-black uppercase leading-tight tracking-wider">
            {title}
          </h1>
        )}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      {footer && <div className="shrink-0 border-t border-zinc-800 p-4">{footer}</div>}
    </div>
  );
}
