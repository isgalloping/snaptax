import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { triggerGisButtonClick } from "./triggerGisButtonClick.ts";

describe("triggerGisButtonClick", () => {
  it("clicks div[role=button] when present", () => {
    let clicked = false;
    const button = {
      click() {
        clicked = true;
      },
    };
    const container = {
      querySelector(sel: string) {
        return sel === 'div[role="button"]' ? button : null;
      },
    } as unknown as HTMLElement;

    assert.equal(triggerGisButtonClick(container), true);
    assert.equal(clicked, true);
  });

  it("returns false when container is empty", () => {
    const container = {
      querySelector() {
        return null;
      },
    } as unknown as HTMLElement;

    assert.equal(triggerGisButtonClick(container), false);
    assert.equal(triggerGisButtonClick(null), false);
  });
});
