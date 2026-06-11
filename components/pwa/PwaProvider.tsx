"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import "@/lib/pwa/deferredInstall";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { PwaInstallProvider } from "./PwaInstallProvider";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <I18nProvider>
        <PwaInstallProvider>{children}</PwaInstallProvider>
      </I18nProvider>
    </SerwistProvider>
  );
}
