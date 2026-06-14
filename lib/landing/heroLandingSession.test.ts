import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginHeroLandingSession,
  endHeroLandingSession,
  heroCountdownSeconds,
  isHeroLandingSessionActive,
} from "./heroLandingSession.ts";

describe("heroLandingSession", () => {
  it("tracks active session lifecycle", () => {
    endHeroLandingSession();
    assert.equal(isHeroLandingSessionActive(), false);
    beginHeroLandingSession();
    assert.equal(isHeroLandingSessionActive(), true);
    endHeroLandingSession();
    assert.equal(isHeroLandingSessionActive(), false);
  });

  it("counts down seconds for button label", () => {
    assert.equal(heroCountdownSeconds(3000, 0), 3);
    assert.equal(heroCountdownSeconds(3000, 500), 3);
    assert.equal(heroCountdownSeconds(3000, 1000), 2);
    assert.equal(heroCountdownSeconds(3000, 2000), 1);
    assert.equal(heroCountdownSeconds(3000, 2900), 1);
    assert.equal(heroCountdownSeconds(3000, 3000), 1);
  });
});
