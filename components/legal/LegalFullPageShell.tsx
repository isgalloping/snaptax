"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/I18nProvider";
import { getLegalBundle } from "@/lib/legal/content";
import { useDialogEscape } from "@/lib/ui/useDialogEscape";

export function LegalFullPageShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string | null;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { locale } = useI18n();
  const bundle = getLegalBundle(locale);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }, [onClose, router]);

  useDialogEscape(true, handleClose);

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      <header className="shrink-0 border-b-4 border-yellow-500 bg-zinc-900 p-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-black uppercase tracking-wider">{title}</h1>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 min-h-12 min-w-12 rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider transition-transform active:scale-95"
            aria-label={bundle.close}
          >
            {bundle.close}
          </button>
        </div>
        {subtitle && <p className="mt-2 text-xs text-zinc-400">{subtitle}</p>}
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl w-full p-6 pb-16">{children}</div>
      </main>
    </div>
  );
}
