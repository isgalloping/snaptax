import { getProviderData } from "flags/next";
import { NextResponse } from "next/server";
import {
  founderPriceDefaultFlag,
  founderPriceEarlyFlag,
  founderPriceFounderFlag,
  founderPriceSuperFlag,
  founderProgramEnabledFlag,
} from "@/flags/founder";
import { specialPriceFlag, specialUsersFlag } from "@/flags/special";

export async function GET() {
  return NextResponse.json(
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
}
