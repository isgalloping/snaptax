"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import "@/lib/pwa/deferredInstall";
import { InstallPrompt } from "./InstallPrompt";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      {children}
      <InstallPrompt />
    </SerwistProvider>
  );
}
