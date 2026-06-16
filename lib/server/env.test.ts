import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getOpenAiBaseUrl } from "./env.ts";

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
