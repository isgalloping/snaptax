"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import {
  getHomeChunkPromise,
  homeChunkReady as isHomeChunkReady,
} from "@/lib/landing/homeChunk";
import type { LandingExitMode } from "@/lib/landing/landingTiming";
import { readStartupShellPhase } from "@/lib/landing/startupPhase";
import { LandingGate } from "@/components/landing/LandingGate";

const HomeScreen = dynamic(
  () =>
    getHomeChunkPromise().then((mod) => ({
      default: mod.HomeScreen,
    })),
  { ssr: false },
);

const OfflineHomeShell = dynamic(
  () =>
    import("@/components/home/OfflineHomeShell").then((mod) => ({
      default: mod.OfflineHomeShell,
    })),
  { ssr: false },
);

type ShellPhase = "landing" | "full-home" | "offline-pack";

export function StartupShell() {
  const [phase, setPhase] = useState<ShellPhase>(() => readStartupShellPhase());
  const [homeChunkReady, setHomeChunkReady] = useState(isHomeChunkReady);

  useEffect(() => {
    performance.mark("startup:shell");
    getHomeChunkPromise()
      .then(() => setHomeChunkReady(true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (phase !== "offline-pack" || !homeChunkReady) return;
    setPhase("full-home");
  }, [phase, homeChunkReady]);

  const handleLandingExit = useCallback((mode: LandingExitMode) => {
    setPhase(mode === "full-home" ? "full-home" : "offline-pack");
  }, []);

  return (
    <div
      className={`relative z-50 flex h-full min-h-0 flex-1 flex-col ${
        phase === "landing" ? "pointer-events-none" : ""
      }`}
    >
      {phase === "full-home" && <HomeScreen />}
      {phase === "offline-pack" && <OfflineHomeShell />}
      {phase === "landing" && (
        <LandingGate
          homeChunkReady={homeChunkReady}
          onExit={handleLandingExit}
        />
      )}
    </div>
  );
}
