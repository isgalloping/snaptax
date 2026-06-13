import { getProviderData } from "flags/next";
import { NextResponse } from "next/server";
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
    }),
  );
}
