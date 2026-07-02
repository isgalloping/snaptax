import { dedupe, flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";
import { getSessionFromCookies } from "@/lib/auth/session";

const identify = dedupe(async () => {
  const session = await getSessionFromCookies();
  if (!session?.email) return {};
  return { user: { email: session.email } };
});

export const founderProgramEnabledFlag = flag<boolean>({
  key: "founderProgramEnabled",
  adapter: vercelAdapter(),
  identify,
  defaultValue: false,
  options: [
    { label: "Off", value: false },
    { label: "On", value: true },
  ],
});

/** Season price in USD (e.g. 5 = $5.00). */
export const founderPriceSuperFlag = flag<number>({
  key: "founderPriceSuper",
  adapter: vercelAdapter(),
  identify,
  defaultValue: 5,
});

export const founderPriceEarlyFlag = flag<number>({
  key: "founderPriceEarly",
  adapter: vercelAdapter(),
  identify,
  defaultValue: 10,
});

export const founderPriceFounderFlag = flag<number>({
  key: "founderPriceFounder",
  adapter: vercelAdapter(),
  identify,
  defaultValue: 15,
});

export const founderPriceDefaultFlag = flag<number>({
  key: "founderPriceDefault",
  adapter: vercelAdapter(),
  identify,
  defaultValue: 29,
});
