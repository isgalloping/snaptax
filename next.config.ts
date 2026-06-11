import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID:
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
      process.env.GOOGLE_CLIENT_ID ??
      "",
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN:
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ??
      process.env.PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN ??
      "",
    NEXT_PUBLIC_PADDLE_PRICE_ID:
      process.env.NEXT_PUBLIC_PADDLE_PRICE_ID ??
      process.env.PADDLE_SNAPTAX_PRICE_KEY ??
      "",
  },
};

export default withSerwist(withNextIntl(nextConfig));
