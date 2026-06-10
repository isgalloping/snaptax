"use client";

import { useCallback, useEffect, useState } from "react";
import type { LandingVariant } from "@/lib/landing/landingVariant";
import { persistLandingVariantCookie } from "@/lib/landing/persistLandingVariantCookie";
import { HomeScreen } from "@/components/home/HomeScreen";
import { LandingGate } from "@/components/landing/LandingGate";

interface StartupShellProps {
  landingVariant: LandingVariant;
}

export function StartupShell({ landingVariant }: StartupShellProps) {
  const [landingDone, setLandingDone] = useState(false);
  const handleLandingDismiss = useCallback(() => setLandingDone(true), []);

  useEffect(() => {
    persistLandingVariantCookie(landingVariant);
  }, [landingVariant]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <HomeScreen />
      {!landingDone && (
        <LandingGate variant={landingVariant} onDismiss={handleLandingDismiss} />
      )}
    </div>
  );
}
