import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findGisButtonInHost,
  waitForGisButtonInHost,
} from "./waitForGisButton.ts";

describe("waitForGisButton", () => {
  it("findGisButtonInHost returns div[role=button]", () => {
    const container = {
      querySelector(sel: string) {
        return sel === 'div[role="button"]' ? { tag: "gis" } : null;
      },
    } as unknown as HTMLElement;

    assert.equal(findGisButtonInHost(container)?.tag, "gis");
    assert.equal(findGisButtonInHost(null), null);
  });

  it("waitForGisButtonInHost resolves when button appears", async () => {
    let ready = false;
    const container = {
      querySelector(sel: string) {
        return ready && sel === 'div[role="button"]' ? { tag: "gis" } : null;
      },
    } as unknown as HTMLElement;

    setTimeout(() => {
      ready = true;
    }, 120);

    const button = await waitForGisButtonInHost(container, {
      timeoutMs: 500,
      intervalMs: 25,
    });
    assert.equal(button?.tag, "gis");
  });

  it("waitForGisButtonInHost returns null on timeout", async () => {
    const container = {
      querySelector() {
        return null;
      },
    } as unknown as HTMLElement;

    const button = await waitForGisButtonInHost(container, {
      timeoutMs: 80,
      intervalMs: 20,
    });
    assert.equal(button, null);
  });
});
