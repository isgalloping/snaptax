"use client";

import type { ReactNode } from "react";
import { PwaInstallProvider } from "@/components/pwa/PwaInstallProvider";

/** Marketing pages: capture install prompt without cold-start landing gate. */
export function MarketingInstallShell({ children }: { children: ReactNode }) {
  return (
    <PwaInstallProvider requireLandingDone={false} showLaunchFromHomeHint={false}>
      {children}
    </PwaInstallProvider>
  );
}
