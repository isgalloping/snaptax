import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isProdLikeDeployEnv,
  runStartupChecks,
  validateAuthSecretsForDeploy,
} from "./startupChecks";

test("isProdLikeDeployEnv detects production and preview", () => {
  const prev = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  assert.equal(isProdLikeDeployEnv(), true);
  process.env.VERCEL_ENV = "preview";
  assert.equal(isProdLikeDeployEnv(), true);
  process.env.VERCEL_ENV = "development";
  assert.equal(isProdLikeDeployEnv(), false);
  process.env.VERCEL_ENV = prev;
});

test("validateAuthSecretsForDeploy rejects missing or identical secrets", () => {
  const prevGhost = process.env.GHOST_HMAC_SECRET;
  const prevAuth = process.env.AUTH_SECRET;
  process.env.GHOST_HMAC_SECRET = "";
  process.env.AUTH_SECRET = "auth-secret-value-32-chars-min!!!";
  assert.throws(() => validateAuthSecretsForDeploy(), /both be set/);
  process.env.GHOST_HMAC_SECRET = "same-secret-value-32-chars-min!!";
  process.env.AUTH_SECRET = "same-secret-value-32-chars-min!!";
  assert.throws(() => validateAuthSecretsForDeploy(), /must be different/);
  process.env.GHOST_HMAC_SECRET = prevGhost;
  process.env.AUTH_SECRET = prevAuth;
});

test("runStartupChecks rejects placeholder webhook secret on preview", () => {
  const prevEnv = process.env.VERCEL_ENV;
  const prevSecret = process.env.PADDLE_WEBHOOK_SECRET;
  const prevGhost = process.env.GHOST_HMAC_SECRET;
  const prevAuth = process.env.AUTH_SECRET;
  process.env.VERCEL_ENV = "preview";
  process.env.PADDLE_WEBHOOK_SECRET = "pdl_ntfset_real_secret_value_here";
  process.env.GHOST_HMAC_SECRET = "ghost-secret-value-32-chars-min!!";
  process.env.AUTH_SECRET = "auth-secret-value-32-chars-min!!!";
  assert.doesNotThrow(() => runStartupChecks());
  process.env.PADDLE_WEBHOOK_SECRET = "changeme";
  assert.throws(() => runStartupChecks(), /PADDLE_WEBHOOK_SECRET/);
  process.env.VERCEL_ENV = prevEnv;
  process.env.PADDLE_WEBHOOK_SECRET = prevSecret;
  process.env.GHOST_HMAC_SECRET = prevGhost;
  process.env.AUTH_SECRET = prevAuth;
});
