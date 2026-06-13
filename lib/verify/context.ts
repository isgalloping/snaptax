import type { Actor } from "@/lib/auth/getActor";
import {
  isMockAIFlag,
  isNeedPayFlag,
  runModelFlag,
  verfyUserFlag,
} from "@/flags/verify";
import {
  buildVerifyContext,
  type VerifyContext,
} from "@/lib/verify/buildVerifyContext";

const FAIL_CLOSED_FLAGS = {
  runModel: "production",
  verfyUser: "",
  isNeedPay: true,
  isMockAI: false,
} as const;

export async function resolveVerifyContext(
  actor: Actor,
): Promise<VerifyContext> {
  try {
    const [runModel, verfyUser, isNeedPay, isMockAI] = await Promise.all([
      runModelFlag(),
      verfyUserFlag(),
      isNeedPayFlag(),
      isMockAIFlag(),
    ]);
    return buildVerifyContext(actor, {
      runModel,
      verfyUser,
      isNeedPay,
      isMockAI,
    });
  } catch {
    return buildVerifyContext(actor, FAIL_CLOSED_FLAGS);
  }
}

export type { VerifyContext };
