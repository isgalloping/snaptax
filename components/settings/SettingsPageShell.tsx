"use client";

import type { ReactNode } from "react";
import { settingsVisual } from "@/lib/ui/settingsVisual";

interface SettingsPageShellProps {
  children: ReactNode;
  /** Slightly darker overlay for list-heavy sub-pages. */
  variant?: "main" | "subpage";
}

export function SettingsPageShell({
  children,
  variant = "main",
}: SettingsPageShellProps) {
  const overlay =
    variant === "subpage"
      ? settingsVisual.pageOverlaySubpage
      : settingsVisual.pageOverlayMain;

  return (
    <div className="relative flex h-full flex-col text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className={settingsVisual.pageImage}
          style={{ backgroundImage: `url(${settingsVisual.pageBackgroundImage})` }}
        />
        <div className="absolute inset-0" style={{ background: overlay }} />
      </div>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
