"use client";

import { useEffect, useRef, useState } from "react";
import type { HomeWidgetsData } from "@/lib/home/computeHomeWidgets";
import { apiFetch } from "@/lib/client/ghostClient";
import {
  markFounderWidgetSeen,
  readFounderWidgetSeen,
} from "@/lib/founder/founderStorage";
import { resolveDisplayTier } from "@/lib/founder/resolveDisplayTier";
import type { FounderStatus, FounderTier } from "@/lib/founder/types";
import { isFounderWidgetVisible } from "@/lib/founder/visibility";
import { logFounderEvent } from "@/lib/founder/logFounderEvent";
import type { FounderWidgetPreview } from "./FounderProgramWidget";
import { WidgetPager } from "./WidgetPager";

type FounderTierConfig = {
  priceUsd: number;
};

type FounderProgramResponse = {
  enabled: boolean;
  claimedCount: number;
  remaining: number;
  programOpen: boolean;
  tiers: Record<FounderTier, FounderTierConfig>;
  user: {
    founderStatus: FounderStatus;
    founderTier: FounderTier | null;
    founderNumber: number | null;
  } | null;
};

interface WidgetStackProps {
  data: HomeWidgetsData;
  actionCount: number;
  isSignedIn: boolean;
  authHydrated: boolean;
  founderRefreshTick?: number;
  onFounderOpen?: () => void;
  onDeadlineDetails: () => void;
  onMissingReview: () => void;
  onProgressDetails: () => void;
  onExport: () => void;
  onNeedActionResnap: () => void;
}

function buildFounderPreview(program: FounderProgramResponse): FounderWidgetPreview {
  const displayTier = resolveDisplayTier({
    claimedCount: program.claimedCount,
    programOpen: program.programOpen,
    user: program.user,
  });
  const priceUsd = program.tiers[displayTier]?.priceUsd ?? program.tiers.DEFAULT.priceUsd;

  return {
    priceUsd,
    remaining: program.remaining,
  };
}

export function WidgetStack({
  isSignedIn,
  authHydrated,
  founderRefreshTick = 0,
  onFounderOpen,
  ...pagerProps
}: WidgetStackProps) {
  const [showFounder, setShowFounder] = useState(false);
  const [showFounderNewBadge, setShowFounderNewBadge] = useState(false);
  const [founderPreview, setFounderPreview] = useState<FounderWidgetPreview | null>(null);
  const impressionLoggedRef = useRef(false);
  const seenMarkedRef = useRef(false);
  const claimedCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!authHydrated) return;

    let cancelled = false;

    void (async () => {
      try {
        const res = await apiFetch("/api/founder/program");
        if (!res.ok || cancelled) return;

        const program = (await res.json()) as FounderProgramResponse;
        if (cancelled) return;

        claimedCountRef.current = program.claimedCount;
        const visible = isFounderWidgetVisible({
          enabled: program.enabled,
          claimedCount: program.claimedCount,
          founderStatus: program.user?.founderStatus ?? "none",
        });
        setShowFounder(visible);
        setFounderPreview(visible ? buildFounderPreview(program) : null);
      } catch {
        if (!cancelled) {
          setShowFounder(false);
          setFounderPreview(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authHydrated, isSignedIn, founderRefreshTick]);

  useEffect(() => {
    if (!showFounder) return;

    if (!seenMarkedRef.current) {
      setShowFounderNewBadge(!readFounderWidgetSeen());
      markFounderWidgetSeen();
      seenMarkedRef.current = true;
    }

    if (!impressionLoggedRef.current) {
      logFounderEvent("founder_widget_impression", {
        claimedCount: claimedCountRef.current ?? undefined,
      });
      impressionLoggedRef.current = true;
    }
  }, [showFounder]);

  return (
    <WidgetPager
      {...pagerProps}
      showFounder={showFounder}
      showFounderNewBadge={showFounderNewBadge}
      founderPreview={founderPreview}
      onFounderOpen={onFounderOpen}
    />
  );
}
