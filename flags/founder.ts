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

export const founderPriceSuperCentsFlag = flag<number>({
  key: "founderPriceSuperCents",
  adapter: vercelAdapter(),
  identify,
  defaultValue: 100,
});

export const founderPriceEarlyCentsFlag = flag<number>({
  key: "founderPriceEarlyCents",
  adapter: vercelAdapter(),
  identify,
  defaultValue: 500,
});

export const founderPriceFounderCentsFlag = flag<number>({
  key: "founderPriceFounderCents",
  adapter: vercelAdapter(),
  identify,
  defaultValue: 2900,
});

export const founderPriceDefaultCentsFlag = flag<number>({
  key: "founderPriceDefaultCents",
  adapter: vercelAdapter(),
  identify,
  defaultValue: 4900,
});
