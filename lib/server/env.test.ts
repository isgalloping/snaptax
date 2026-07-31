import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  applyEnvAliases,
  getAuthSecret,
  getGhostHmacSecret,
  getOpenAiBaseUrl,
} from "./env.ts";

const ENV_KEYS = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "GHOST_HMAC_SECRET",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "SUPABASE_JWT_SECRET",
  "VERCEL_ENV",
] as const;

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

function resetTrackedEnv(): void {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function clearTrackedEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

afterEach(() => {
  resetTrackedEnv();
});

describe("server env secret resolution", () => {
  it("does not cross-fallback Ghost/Auth secrets in production", () => {
    clearTrackedEnv();
    process.env.VERCEL_ENV = "production";
    process.env.SUPABASE_JWT_SECRET = "supabase-secret";
    process.env.AUTH_SECRET = "auth-secret";

    assert.equal(getGhostHmacSecret(), "");

    delete process.env.AUTH_SECRET;
    process.env.GHOST_HMAC_SECRET = "ghost-secret";

    assert.equal(getAuthSecret(), "");
  });

  it("does not cross-fallback Ghost/Auth secrets in preview", () => {
    clearTrackedEnv();
    process.env.VERCEL_ENV = "preview";
    process.env.SUPABASE_JWT_SECRET = "supabase-secret";
    process.env.AUTH_SECRET = "auth-secret";

    assert.equal(getGhostHmacSecret(), "");

    delete process.env.AUTH_SECRET;
    process.env.GHOST_HMAC_SECRET = "ghost-secret";

    assert.equal(getAuthSecret(), "");
  });

  it("keeps local development fallbacks for Ghost/Auth secrets", () => {
    clearTrackedEnv();
    process.env.SUPABASE_JWT_SECRET = "supabase-secret";

    assert.equal(getGhostHmacSecret(), "supabase-secret");
    assert.equal(getAuthSecret(), "supabase-secret");

    process.env.AUTH_SECRET = "auth-secret";
    process.env.GHOST_HMAC_SECRET = "ghost-secret";

    assert.equal(getGhostHmacSecret(), "ghost-secret");
    assert.equal(getAuthSecret(), "auth-secret");
  });

  for (const vercelEnv of ["production", "preview"] as const) {
    it(`does not alias Ghost/Auth secrets from fallbacks on ${vercelEnv} deploys`, () => {
      clearTrackedEnv();
      process.env.VERCEL_ENV = vercelEnv;
      process.env.POSTGRES_URL_NON_POOLING = "postgres://direct";
      process.env.SUPABASE_JWT_SECRET = "supabase-secret";

      applyEnvAliases();

      assert.equal(process.env.DATABASE_URL, "postgres://direct");
      assert.equal(process.env.GHOST_HMAC_SECRET, undefined);
      assert.equal(process.env.AUTH_SECRET, undefined);
    });
  }

  it("aliases Ghost/Auth secrets from fallbacks only outside prod-like deploys", () => {
    clearTrackedEnv();
    process.env.POSTGRES_PRISMA_URL = "postgres://pool";
    process.env.SUPABASE_JWT_SECRET = "supabase-secret";

    applyEnvAliases();

    assert.equal(process.env.DATABASE_URL, "postgres://pool");
    assert.equal(process.env.GHOST_HMAC_SECRET, "supabase-secret");
    assert.equal(process.env.AUTH_SECRET, "supabase-secret");
  });
});

describe("getOpenAiBaseUrl", () => {
  const prev = process.env.OPENAI_BASE_URL;

  afterEach(() => {
    if (prev === undefined) delete process.env.OPENAI_BASE_URL;
    else process.env.OPENAI_BASE_URL = prev;
  });

  it("returns undefined when unset", () => {
    delete process.env.OPENAI_BASE_URL;
    assert.equal(getOpenAiBaseUrl(), undefined);
  });

  it("normalizes trailing slashes", () => {
    process.env.OPENAI_BASE_URL = "https://maxapi.pro/v1/";
    assert.equal(getOpenAiBaseUrl(), "https://maxapi.pro/v1");
  });
});
