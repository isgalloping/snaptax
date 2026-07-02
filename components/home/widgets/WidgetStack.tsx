"use client";

import { useEffect, useRef, useState } from "react";
import type { HomeWidgetsData } from "@/lib/home/computeHomeWidgets";
import { apiFetch } from "@/lib/client/ghostClient";
import {
  markFounderWidgetSeen,
  readFounderWidgetSeen,
} from "@/lib/founder/founderStorage";
import { isFounderWidgetVisible } from "@/lib/founder/visibility";
import { logFounderEvent } from "@/lib/founder/logFounderEvent";
import type { FounderStatus } from "@/lib/founder/types";
import { WidgetPager } from "./WidgetPager";

type FounderProgramResponse = {
  enabled: boolean;
  claimedCount: number;
  user: {
    founderStatus: FounderStatus;
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

export function WidgetStack({
  isSignedIn,
  authHydrated,
  founderRefreshTick = 0,
  onFounderOpen,
  ...pagerProps
}: WidgetStackProps) {
  const [showFounder, setShowFounder] = useState(false);
  const [showFounderNewBadge, setShowFounderNewBadge] = useState(false);
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
      } catch {
        if (!cancelled) setShowFounder(false);
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
      onFounderOpen={onFounderOpen}
    />
  );
}
