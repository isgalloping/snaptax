import type { Actor } from "@/lib/auth/getActor";

export type VerifyFlagValues = {
  runModel: string;
  verfyUser: string;
  isNeedPay: boolean;
  isMockAI: boolean;
};

export type VerifyContext = {
  isVerifyMode: boolean;
  isWhitelisted: boolean;
  canBypass: boolean;
  canBypassPay: boolean;
  canMockAi: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function buildVerifyContext(
  actor: Actor,
  flags: VerifyFlagValues,
): VerifyContext {
  const isVerifyMode = flags.runModel === "verify";
  const isWhitelisted =
    actor.kind === "user" &&
    !!actor.email &&
    !!flags.verfyUser &&
    normalizeEmail(actor.email) === normalizeEmail(flags.verfyUser);
  const canBypass = isVerifyMode && isWhitelisted;

  return {
    isVerifyMode,
    isWhitelisted,
    canBypass,
    canBypassPay: canBypass && flags.isNeedPay === false,
    canMockAi: canBypass && flags.isMockAI === true,
  };
}
