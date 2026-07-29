"use client";

import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useUserCopy } from "@/components/i18n/I18nProvider";
import { openPwaAppEntry } from "@/lib/marketing/openPwaAppEntry";
import {
  APP_ENTRY_GATE_DISMISSED_EVENT,
  dismissAppEntryGate,
  readAppBrowserEntryGateEligibility,
} from "@/lib/pwa/appBrowserEntry";
import {
  canNativeInstallPrompt,
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  subscribeLandingDone,
} from "@/lib/pwa/deferredInstall";
import { isPwaInstalledOnDevice } from "@/lib/pwa/installedDetect";
import { getInstallPlatform } from "@/lib/pwa/installPlatform";

type GatePhase = "hidden" | "install" | "manual" | "post-install" | "open";

type AppBrowserEntryGateProps = {
  onActiveChange?: (active: boolean) => void;
};

export function AppBrowserEntryGate({ onActiveChange }: AppBrowserEntryGateProps) {
  const pathname = usePathname();
  const titleId = useId();
  const copy = useUserCopy().pwa;
  const gateCopy = copy.appEntryGate;
  const [phase, setPhase] = useState<GatePhase>("hidden");
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    onActiveChange?.(phase !== "hidden");
  }, [phase, onActiveChange]);

  const syncEligibility = useCallback(async () => {
    const reason = readAppBrowserEntryGateEligibility(pathname);
    if (reason !== "eligible") {
      setPhase("hidden");
      return;
    }

    setCanPrompt(canNativeInstallPrompt());
    const installed = await isPwaInstalledOnDevice();
    setPhase((current) => {
      if (current === "post-install" || current === "manual") {
        return current;
      }
      return installed ? "open" : "install";
    });
  }, [pathname]);

  useEffect(() => {
    void syncEligibility();
    const unsubLanding = subscribeLandingDone(() => {
      void syncEligibility();
    });
    const onInstalled = () => {
      if (getInstallPlatform() === "chromium-android") {
        setPhase("post-install");
      }
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      unsubLanding();
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [syncEligibility]);

  const finishGateForSession = useCallback((notifyInstallUi = true) => {
    dismissAppEntryGate();
    setPhase("hidden");
    if (notifyInstallUi) {
      window.dispatchEvent(new Event(APP_ENTRY_GATE_DISMISSED_EVENT));
    }
  }, []);

  const continueInBrowser = useCallback(() => {
    finishGateForSession(true);
  }, [finishGateForSession]);

  const runAndroidInstall = useCallback(async () => {
    const deferredPrompt = getDeferredInstallPrompt();
    if (!deferredPrompt) {
      setPhase("manual");
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        clearDeferredInstallPrompt();
        setPhase("post-install");
      }
    } catch {
      setPhase("manual");
    }
  }, []);

  const handlePrimaryInstall = useCallback(() => {
    const platform = getInstallPlatform();
    if (platform === "ios-safari") {
      setPhase("manual");
      return;
    }
    void runAndroidInstall();
  }, [runAndroidInstall]);

  if (phase === "hidden") return null;

  const shell = (content: ReactNode) => (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-2xl">
        {content}
      </div>
    </div>
  );

  if (phase === "open") {
    return shell(
      <>
        <h2 id={titleId} className="text-lg font-black text-white">
          {gateCopy.openTitle}
        </h2>
        <p className="mt-2 text-sm leading-snug text-zinc-300">
          {copy.launchFromHomeHint}
        </p>
        <button
          type="button"
          onClick={() => openPwaAppEntry()}
          className="mt-5 min-h-14 w-full rounded-xl bg-yellow-500 text-sm font-black text-black active:scale-95"
        >
          {gateCopy.openTitle}
        </button>
        <button
          type="button"
          onClick={continueInBrowser}
          className="mt-3 min-h-12 w-full text-sm font-bold text-zinc-400 active:scale-95"
        >
          {gateCopy.continueInBrowser}
        </button>
      </>,
    );
  }

  if (phase === "post-install") {
    return shell(
      <>
        <h2 id={titleId} className="text-lg font-black text-white">
          {gateCopy.postInstallTitle}
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
          {gateCopy.postInstallSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => finishGateForSession(true)}
          className="mt-5 min-h-14 w-full rounded-xl bg-yellow-500 text-sm font-black text-black active:scale-95"
        >
          {copy.webApkGuide.gotIt}
        </button>
      </>,
    );
  }

  if (phase === "manual") {
    const steps =
      getInstallPlatform() === "ios-safari"
        ? copy.manualSteps.iosSafari
        : copy.manualSteps.chromiumAndroid;

    return shell(
      <>
        <h2 id={titleId} className="text-lg font-black text-white">
          {copy.manualSheetTitle}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">{copy.manualSheetLead}</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-300">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => setPhase("post-install")}
          className="mt-5 min-h-14 w-full rounded-xl bg-yellow-500 text-sm font-black text-black active:scale-95"
        >
          {gateCopy.addedToHomeScreen}
        </button>
        <button
          type="button"
          onClick={continueInBrowser}
          className="mt-3 min-h-12 w-full text-sm font-bold text-zinc-400 active:scale-95"
        >
          {gateCopy.continueInBrowser}
        </button>
      </>,
    );
  }

  return shell(
    <>
      <h2 id={titleId} className="text-lg font-black text-white">
        {gateCopy.installTitle}
      </h2>
      <p className="mt-2 text-sm leading-snug text-zinc-300">
        {getInstallPlatform() === "chromium-android"
          ? copy.webApkGuide.preInstallBody
          : copy.subtitle}
      </p>
      <button
        type="button"
        onClick={handlePrimaryInstall}
        className="mt-5 min-h-14 w-full rounded-xl bg-yellow-500 text-sm font-black text-black active:scale-95"
      >
        {canPrompt ? copy.install : copy.howToInstall}
      </button>
      <button
        type="button"
        onClick={continueInBrowser}
        className="mt-3 min-h-12 w-full text-sm font-bold text-zinc-400 active:scale-95"
      >
        {gateCopy.continueInBrowser}
      </button>
    </>,
  );
}
