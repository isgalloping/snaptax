import "server-only";

import { cookies } from "next/headers";
import { evaluate } from "flags/next";
import { landingVariant, type LandingVariant } from "@/flags/landing";
import { LANDING_COOKIE } from "./landingVariant";

function isLandingVariant(value: string | undefined | null): value is LandingVariant {
  return value === "data_stream" || value === "simple_using";
}

function readEnvOverride(): LandingVariant | null {
  if (process.env.NODE_ENV === "production") return null;
  const envOverride = process.env.LANDING_VARIANT;
  return isLandingVariant(envOverride) ? envOverride : null;
}

async function assignVariant(): Promise<LandingVariant> {
  const envOverride = readEnvOverride();
  if (envOverride) {
    return envOverride;
  }
  const [variant] = await evaluate([landingVariant]);
  return variant;
}

/** Read landing variant for SSR. Cookie writes happen on the client (Next.js 16 restriction). */
export async function resolveLandingVariant(): Promise<LandingVariant> {
  const envOverride = readEnvOverride();
  if (envOverride) {
    return envOverride;
  }

  const cookieStore = await cookies();
  const existing = cookieStore.get(LANDING_COOKIE)?.value;
  if (isLandingVariant(existing)) {
    return existing;
  }

  return assignVariant();
}
