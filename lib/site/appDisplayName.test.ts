import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import { getAppDisplayName } from "@/lib/site/appDisplayName";

function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => void,
): void {
  const saved: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    saved[key] = process.env[key];
    const value = vars[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(vars)) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

describe("getAppDisplayName", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
  });

  it("returns SnapTax-Pre for snaptax-pre preview domain", () => {
    withEnv(
      {
        NEXT_PUBLIC_APP_URL: "https://snaptax-pre.lightxforge.com",
        VERCEL_URL: undefined,
      },
      () => {
        assert.equal(getAppDisplayName(), "SnapTax-Pre");
      },
    );
  });

  it("returns SnapTax for production domain", () => {
    withEnv(
      {
        NEXT_PUBLIC_APP_URL: "https://snaptax.lightxforge.com",
        VERCEL_URL: undefined,
      },
      () => {
        assert.equal(getAppDisplayName(), "SnapTax");
      },
    );
  });

  it("returns SnapTax when env unset (local default URL)", () => {
    withEnv({ NEXT_PUBLIC_APP_URL: undefined, VERCEL_URL: undefined }, () => {
      assert.equal(getAppDisplayName(), "SnapTax");
    });
  });

  it("returns SnapTax for invalid URL (safe fallback)", () => {
    withEnv(
      { NEXT_PUBLIC_APP_URL: "not-a-url", VERCEL_URL: undefined },
      () => {
        assert.equal(getAppDisplayName(), "SnapTax");
      },
    );
  });
});
