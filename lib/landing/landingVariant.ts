import type { OnboardingStatus } from "@/lib/onboarding/onboardingState";
import { ONBOARDING_STATUS_MIRROR_KEY } from "@/lib/onboarding/onboardingStorage";

export type LandingVariant = "hero" | "data_stream" | "none";

export function landingVariantFromStatus(
  status: OnboardingStatus | null | undefined,
): LandingVariant {
  if (status === "completed") return "data_stream";
  if (status === "not_started") return "hero";
  if (
    status === "stage_1" ||
    status === "stage_2" ||
    status === "stage_3" ||
    status === "stage_4"
  ) {
    return "none";
  }
  return "hero";
}

export function readOnboardingStatusMirror(): OnboardingStatus | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_STATUS_MIRROR_KEY);
    if (
      raw === "not_started" ||
      raw === "stage_1" ||
      raw === "stage_2" ||
      raw === "stage_3" ||
      raw === "stage_4" ||
      raw === "deferred_login" ||
      raw === "completed"
    ) {
      return raw;
    }
  } catch {
    // private mode
  }
  return null;
}

export function readLandingVariantMirror(): LandingVariant {
  return landingVariantFromStatus(readOnboardingStatusMirror());
}
