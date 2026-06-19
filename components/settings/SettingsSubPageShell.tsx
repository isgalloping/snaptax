"use client";

import type { ReactNode } from "react";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
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
    <SettingsPageShell variant="subpage">
      <div ref={swipeRef} className="flex h-full min-h-0 flex-col">
        <SettingsHeader onBack={onBack} title={title} />
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-zinc-800/80 bg-black/30 p-4 backdrop-blur-sm">
            {footer}
          </div>
        )}
      </div>
    </SettingsPageShell>
  );
}
