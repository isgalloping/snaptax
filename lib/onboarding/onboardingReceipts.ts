import type { Receipt } from "@/lib/types";
import type { OnboardingStatus } from "./onboardingState";

/** Hide shadow demo from list until sandbox shutter completes it. */
export function visibleReceiptsForOnboarding(
  receipts: Receipt[],
  status: OnboardingStatus | null,
): Receipt[] {
  if (status !== "stage_1") return receipts;
  return receipts.filter(
    (r) => !(r.isOnboardingDemo && r.status === "processing"),
  );
}
