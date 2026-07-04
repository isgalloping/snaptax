import type { PaymentSuccessPhase, PaymentSuccessVariant } from "./paymentSuccessTypes";

export async function runPaymentSuccessFlow(deps: {
  variant: PaymentSuccessVariant;
  season: string;
  onPhaseChange: (phase: PaymentSuccessPhase) => void;
  onFounderNumber?: (n: number | null) => void;
  pollEntitlementReady: (season: string, maxMs: number) => Promise<boolean>;
  refreshSeasonPaid: () => Promise<void>;
  waitForFounderActive?: () => Promise<boolean>;
  fetchFounderNumber?: () => Promise<number | null>;
  maxWaitMs?: number;
}): Promise<void> {
  const maxWaitMs = deps.maxWaitMs ?? 30_000;
  try {
    const ready = await deps.pollEntitlementReady(deps.season, maxWaitMs);
    if (!ready) {
      deps.onPhaseChange("error");
      return;
    }
    await deps.refreshSeasonPaid();
    if (deps.variant === "founder") {
      await deps.waitForFounderActive?.();
      const n = (await deps.fetchFounderNumber?.()) ?? null;
      deps.onFounderNumber?.(n);
    }
    deps.onPhaseChange("ready");
  } catch {
    deps.onPhaseChange("error");
  }
}
