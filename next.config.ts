import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "fontkit"],
  outputFileTracingIncludes: {
    "/api/export/tax-pack": ["./node_modules/pdfkit/js/data/**"],
  },
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
      process.env.PADDLE_PRICE_ID ??
      process.env.FOUNDER_LEVEL_DEFAULT ??
      process.env.PADDLE_SNAPTAX_PRICE_KEY ??
      "",
  },
};

export default withSerwist(nextConfig);
