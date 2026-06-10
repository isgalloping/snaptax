export type LandingVariant = "data_stream" | "simple_using";

export const LANDING_COOKIE = "snap1099_landing_variant";
export const LANDING_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const LANDING_MAX_MS = 2500;
export const LANDING_FADE_MS = 200;

export const LANDING_VARIANT_MIN_MS: Record<LandingVariant, number> = {
  data_stream: 2400,
  simple_using: 1200,
};

export function parseLandingVariant(value: string | undefined | null): LandingVariant {
  if (value === "data_stream" || value === "simple_using") {
    return value;
  }
  return "simple_using";
}

export function landingDismissMs(variant: LandingVariant): number {
  return Math.min(LANDING_VARIANT_MIN_MS[variant], LANDING_MAX_MS);
}
