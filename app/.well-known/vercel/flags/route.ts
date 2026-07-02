import { getProviderData } from "flags/next";
import { NextResponse } from "next/server";
import {
  founderPriceDefaultCentsFlag,
  founderPriceEarlyCentsFlag,
  founderPriceFounderCentsFlag,
  founderPriceSuperCentsFlag,
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
      founderPriceSuperCentsFlag,
      founderPriceEarlyCentsFlag,
      founderPriceFounderCentsFlag,
      founderPriceDefaultCentsFlag,
    }),
  );
}
