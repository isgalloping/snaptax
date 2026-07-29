import assert from "node:assert/strict";
import { describe, it } from "node:test";
import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("opens installed app at /app", () => {
    const data = manifest();
    assert.equal(data.start_url, "/app");
    assert.equal(data.scope, "/app");
    assert.equal(data.id, "/app");
    assert.equal(data.capture_links, "existing-client-navigate");
  });

  it("uses SnapTax display name by default", () => {
    const prevUrl = process.env.NEXT_PUBLIC_APP_URL;
    const prevVercel = process.env.VERCEL_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    try {
      const data = manifest();
      assert.equal(data.name, "SnapTax");
      assert.equal(data.short_name, "SnapTax");
    } finally {
      if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = prevUrl;
      if (prevVercel === undefined) delete process.env.VERCEL_URL;
      else process.env.VERCEL_URL = prevVercel;
    }
  });

  it("uses SnapTax-Pre display name on preview domain", () => {
    const prevUrl = process.env.NEXT_PUBLIC_APP_URL;
    const prevVercel = process.env.VERCEL_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://snaptax-pre.lightxforge.com";
    delete process.env.VERCEL_URL;
    try {
      const data = manifest();
      assert.equal(data.name, "SnapTax-Pre");
      assert.equal(data.short_name, "SnapTax-Pre");
    } finally {
      if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = prevUrl;
      if (prevVercel === undefined) delete process.env.VERCEL_URL;
      else process.env.VERCEL_URL = prevVercel;
    }
  });
});
