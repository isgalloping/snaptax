import { getProviderData } from "flags/next";
import { NextResponse } from "next/server";
import {
  founderPriceDefaultFlag,
  founderPriceEarlyFlag,
  founderPriceFounderFlag,
  founderPriceSuperFlag,
  founderProgramEnabledFlag,
} from "@/flags/founder";
import {
  isMockAIFlag,
  isNeedPayFlag,
  runModelFlag,
  verfyUserFlag,
} from "@/flags/verify";

export async function GET() {
  return NextResponse.json(
    getProviderData({
      runModelFlag,
      verfyUserFlag,
      isNeedPayFlag,
      isMockAIFlag,
      founderProgramEnabledFlag,
      founderPriceSuperFlag,
      founderPriceEarlyFlag,
      founderPriceFounderFlag,
      founderPriceDefaultFlag,
    }),
  );
}
