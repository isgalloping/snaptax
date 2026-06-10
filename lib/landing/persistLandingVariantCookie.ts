import {
  LANDING_COOKIE,
  LANDING_COOKIE_MAX_AGE,
  type LandingVariant,
} from "./landingVariant";

/** Persist sticky variant after SSR assignment (Server Components cannot set cookies). */
export function persistLandingVariantCookie(variant: LandingVariant): void {
  if (typeof document === "undefined") return;

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LANDING_COOKIE}=(data_stream|simple_using)`),
  );
  if (match?.[1] === variant) return;

  document.cookie = `${LANDING_COOKIE}=${variant}; path=/; max-age=${LANDING_COOKIE_MAX_AGE}; SameSite=Lax`;
}
