"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import "@/lib/pwa/deferredInstall";
import { PwaInstallProvider } from "./PwaInstallProvider";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <PwaInstallProvider>{children}</PwaInstallProvider>
    </SerwistProvider>
  );
}
