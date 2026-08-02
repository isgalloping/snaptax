import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  getOpenAiBaseUrl,
  getPaddleClientToken,
  getPaddlePriceId,
} from "./env.ts";

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

describe("Paddle env accessors", () => {
  const envKeys = [
    "PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN",
    "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN",
    "FOUNDER_LEVEL_DEFAULT",
    "PADDLE_PRICE_ID",
    "PADDLE_SNAPTAX_PRICE_KEY",
  ] as const;
  const prev = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

  afterEach(() => {
    for (const key of envKeys) {
      const value = prev[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("reads the Paddle client token from the SnapTax-specific server env", () => {
    process.env.PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN = "test_client_token";
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN = "legacy_public_token";

    assert.equal(getPaddleClientToken(), "test_client_token");
  });

  it("does not fall back to the legacy public Paddle client token name", () => {
    delete process.env.PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN;
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN = "legacy_public_token";

    assert.equal(getPaddleClientToken(), "");
  });

  it("reads the default Paddle price only from the founder level env", () => {
    delete process.env.FOUNDER_LEVEL_DEFAULT;
    process.env.PADDLE_PRICE_ID = "pri_legacy";
    process.env.PADDLE_SNAPTAX_PRICE_KEY = "pri_legacy_key";

    assert.equal(getPaddlePriceId(), "");

    process.env.FOUNDER_LEVEL_DEFAULT = "pri_default";
    assert.equal(getPaddlePriceId(), "pri_default");
  });
});
