"use client";

import type { ReactNode } from "react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { useSwipeBack } from "@/lib/client/useSwipeBack";

interface SettingsSubPageShellProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function SettingsSubPageShell({
  title,
  onBack,
  children,
  footer,
}: SettingsSubPageShellProps) {
  const swipeRef = useSwipeBack({ onBack });

  return (
    <div ref={swipeRef} className="flex h-full flex-col bg-black text-white">
      <SettingsHeader onBack={onBack} title={title} />
      <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      {footer && <div className="shrink-0 border-t border-zinc-800 p-4">{footer}</div>}
    </div>
  );
}
