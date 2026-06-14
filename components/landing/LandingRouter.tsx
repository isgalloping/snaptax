"use client";

import { useEffect, useState } from "react";
import { getOnboardingStatus } from "@/lib/onboarding/onboardingState";
import {
  landingVariantFromStatus,
  readOnboardingStatusMirror,
  type LandingVariant,
} from "@/lib/landing/landingVariant";
import { DataStreamLanding } from "./DataStreamLanding";
import { HeroWelcomeLanding } from "./HeroWelcomeLanding";

type ResolvedVariant = LandingVariant | "pending";

export function LandingRouter() {
  const [variant, setVariant] = useState<ResolvedVariant>("pending");

  useEffect(() => {
    let cancelled = false;

    const apply = (next: LandingVariant) => {
      if (!cancelled) setVariant(next);
    };

    const mirrorStatus = readOnboardingStatusMirror();
    if (mirrorStatus != null) {
      apply(landingVariantFromStatus(mirrorStatus));
    }

    void getOnboardingStatus().then((status) => {
      apply(landingVariantFromStatus(status));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (variant === "pending") {
    return <div className="h-full min-h-0 bg-black" aria-hidden />;
  }

  if (variant === "data_stream") {
    return <DataStreamLanding />;
  }

  if (variant === "hero") {
    return <HeroWelcomeLanding />;
  }

  return <div className="h-full min-h-0 bg-black" aria-hidden />;
}
