import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next";
import { landingVariant } from "@/flags/landing";

export const GET = createFlagsDiscoveryEndpoint(() =>
  getProviderData({ landingVariant }),
);
