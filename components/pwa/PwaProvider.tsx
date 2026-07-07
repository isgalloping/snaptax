"use client";

import { useCallback, useState } from "react";
import { SerwistProvider } from "@serwist/turbopack/react";
import "@/lib/pwa/deferredInstall";
import { AppBrowserEntryGate } from "./AppBrowserEntryGate";
import { PwaInstallProvider } from "./PwaInstallProvider";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [entryGateActive, setEntryGateActive] = useState(false);
  const handleGateActiveChange = useCallback((active: boolean) => {
    setEntryGateActive(active);
  }, []);

  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <PwaInstallProvider
        suppressWebApkGuide={entryGateActive}
        suppressInstallBar={entryGateActive}
      >
        {children}
        <AppBrowserEntryGate onActiveChange={handleGateActiveChange} />
      </PwaInstallProvider>
    </SerwistProvider>
  );
}
