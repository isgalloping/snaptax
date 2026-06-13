import { dedupe, flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";
import { getSessionFromCookies } from "@/lib/auth/session";

const identify = dedupe(async () => {
  const session = await getSessionFromCookies();
  if (!session?.email) return {};
  return { user: { email: session.email } };
});

export const runModelFlag = flag<string>({
  key: "runModel",
  adapter: vercelAdapter(),
  identify,
  defaultValue: "production",
  options: [
    { label: "验证模式", value: "verify" },
    { label: "生产模式", value: "production" },
  ],
});

export const verfyUserFlag = flag<string>({
  key: "verfyUser",
  adapter: vercelAdapter(),
  identify,
  defaultValue: "",
});

export const isNeedPayFlag = flag<boolean>({
  key: "isNeedPay",
  adapter: vercelAdapter(),
  identify,
  defaultValue: true,
  options: [
    { label: "Off", value: false },
    { label: "On", value: true },
  ],
});

export const isMockAIFlag = flag<boolean>({
  key: "isMockAI",
  adapter: vercelAdapter(),
  identify,
  defaultValue: false,
  options: [
    { label: "Off", value: false },
    { label: "On", value: true },
  ],
});
