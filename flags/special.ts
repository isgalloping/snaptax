import { dedupe, flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";
import { getSessionFromCookies } from "@/lib/auth/session";

const identify = dedupe(async () => {
  const session = await getSessionFromCookies();
  if (!session?.email) return {};
  return { user: { email: session.email } };
});

export const specialUsersFlag = flag<string>({
  key: "specialUsers",
  adapter: vercelAdapter(),
  identify,
  defaultValue: "",
});

/** Season price in USD for internal test users (e.g. 1 = $1.00). */
export const specialPriceFlag = flag<number>({
  key: "specialPrice",
  adapter: vercelAdapter(),
  identify,
  defaultValue: 0,
});
