import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  applyLandingDoneToDocument,
  markLandingDonePersisted,
  readStartupShellPhase,
} from "./startupPhase";

describe("readStartupShellPhase", () => {
  const storage = new Map<string, string>();
  let htmlClassList: Set<string>;

  beforeEach(() => {
    storage.clear();
    htmlClassList = new Set<string>();
    (globalThis as { window?: typeof globalThis }).window = globalThis;
    (globalThis as { window?: Window & typeof globalThis }).window!.dispatchEvent =
      () => true;
    (globalThis as { document?: Document }).document = {
      documentElement: {
        classList: {
          contains: (name: string) => htmlClassList.has(name),
          add: (name: string) => {
            htmlClassList.add(name);
          },
          remove: (name: string) => {
            htmlClassList.delete(name);
          },
        },
      },
    } as Document;
    (globalThis as { sessionStorage?: Storage }).sessionStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
      removeItem: (key) => {
        storage.delete(key);
      },
      clear: () => storage.clear(),
      key: () => null,
      length: 0,
    };
  });

  afterEach(() => {
    delete (globalThis as { window?: typeof globalThis }).window;
    delete (globalThis as { document?: Document }).document;
    delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
  });

  it("starts at landing on cold boot", () => {
    assert.equal(readStartupShellPhase(), "landing");
  });

  it("skips landing when html.landing-done is set", () => {
    htmlClassList.add("landing-done");
    assert.equal(readStartupShellPhase(), "full-home");
  });

  it("skips landing when session mirror is set", () => {
    markLandingDonePersisted();
    assert.equal(readStartupShellPhase(), "full-home");
  });

  it("applyLandingDoneToDocument sets class and session mirror", () => {
    applyLandingDoneToDocument();
    assert.equal(readStartupShellPhase(), "full-home");
    assert.equal(htmlClassList.has("landing-done"), true);
  });
});
