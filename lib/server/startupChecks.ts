import { getPaddleWebhookSecret } from "@/lib/server/env";
import { isPaddleWebhookSecretPlaceholder } from "@/lib/server/paddleWebhookSecret";

export function isProdLikeDeployEnv(): boolean {
  const env = process.env.VERCEL_ENV;
  return env === "production" || env === "preview";
}

export function validateAuthSecretsForDeploy(): void {
  const ghost = process.env.GHOST_HMAC_SECRET?.trim() ?? "";
  const auth = process.env.AUTH_SECRET?.trim() ?? "";

  if (!ghost || !auth) {
    throw new Error(
      "GHOST_HMAC_SECRET and AUTH_SECRET must both be set in production/preview",
    );
  }

  if (ghost === auth) {
    throw new Error(
      "GHOST_HMAC_SECRET and AUTH_SECRET must be different in production/preview",
    );
  }
}

export function validateProductionBillingFlags(): void {
  if (process.env.VERCEL_ENV !== "production") return;
  if (process.env.ALLOW_PADDLE_LEGACY_USER_ID === "1") {
    throw new Error(
      "ALLOW_PADDLE_LEGACY_USER_ID must not be enabled in production",
    );
  }
}

export function runStartupChecks(): void {
  if (isProdLikeDeployEnv()) {
    validateAuthSecretsForDeploy();
    validateProductionBillingFlags();

    const secret = getPaddleWebhookSecret();
    if (!secret || isPaddleWebhookSecretPlaceholder(secret)) {
      throw new Error(
        "PADDLE_WEBHOOK_SECRET must be a real Paddle destination secret in production/preview",
      );
    }
  }
}
