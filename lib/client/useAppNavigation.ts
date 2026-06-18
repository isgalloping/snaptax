"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SettingsViewState } from "@/components/settings/settingsViewState";
import type { HomeOverlay } from "@/components/home/overlays/HomeOverlayHost";
import {
  bootstrapNavTrap,
  decodePopStateEvent,
  homeOverlayNavToKey,
  mapNavKeyToTarget,
  navigateBackScreen,
  pushNavScreen,
  replaceNavScreen,
  type HomeOverlayNav,
  type SnapNavKey,
} from "@/lib/client/appNavigationHistory";

function overlayToNav(overlay: NonNullable<HomeOverlay>): HomeOverlayNav {
  if (typeof overlay === "object" && overlay.type === "missing-deduction-item") {
    return { type: "missing-deduction-item", hintId: overlay.hintId };
  }
  return overlay;
}

export function useAppNavigation({
  onPopTarget,
}: {
  onPopTarget: (target: ReturnType<typeof mapNavKeyToTarget>) => void;
}) {
  const onPopTargetRef = useRef(onPopTarget);
  const navigatingRef = useRef(false);

  useEffect(() => {
    onPopTargetRef.current = onPopTarget;
  });

  useEffect(() => {
    bootstrapNavTrap();

    const onPopState = (event: PopStateEvent) => {
      const key = decodePopStateEvent(event.state);
      if (!key) return;
      navigatingRef.current = true;
      try {
        onPopTargetRef.current(mapNavKeyToTarget(key));
      } finally {
        navigatingRef.current = false;
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigateBack = useCallback(() => {
    navigateBackScreen();
  }, []);

  const pushOverlay = useCallback((overlay: NonNullable<HomeOverlay>) => {
    pushNavScreen(homeOverlayNavToKey(overlayToNav(overlay)));
  }, []);

  const openSettings = useCallback(() => {
    pushNavScreen({ kind: "settings", page: "main" });
  }, []);

  const pushSettingsPage = useCallback((page: SettingsViewState) => {
    pushNavScreen({ kind: "settings", page });
  }, []);

  const replaceSettingsPage = useCallback((page: SettingsViewState) => {
    replaceNavScreen({ kind: "settings", page });
  }, []);

  const pushHome = useCallback(() => {
    pushNavScreen({ kind: "home" });
  }, []);

  return {
    navigateBack,
    pushOverlay,
    openSettings,
    pushSettingsPage,
    replaceSettingsPage,
    pushHome,
    isNavigatingRef: navigatingRef,
  };
}

export type AppNavigation = ReturnType<typeof useAppNavigation>;

/** Push a nav key without React state (for tests / advanced use). */
export function pushNavKey(key: SnapNavKey): void {
  pushNavScreen(key);
}
