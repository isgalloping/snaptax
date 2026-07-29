import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next";
import {
  founderPriceDefaultFlag,
  founderPriceEarlyFlag,
  founderPriceFounderFlag,
  founderPriceSuperFlag,
  founderProgramEnabledFlag,
} from "@/flags/founder";
import { specialPriceFlag, specialUsersFlag } from "@/flags/special";

/** Flags Explorer discovery — requires Authorization (FLAGS_SECRET); 401 if missing/invalid. */
export const GET = createFlagsDiscoveryEndpoint(async () =>
  getProviderData({
    specialUsersFlag,
    specialPriceFlag,
    founderProgramEnabledFlag,
    founderPriceSuperFlag,
    founderPriceEarlyFlag,
    founderPriceFounderFlag,
    founderPriceDefaultFlag,
  }),
);
