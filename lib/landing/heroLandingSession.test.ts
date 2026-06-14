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

  it("counts down seconds for 3s auto-advance", () => {
    assert.equal(heroCountdownSeconds(3000, 0), 3);
    assert.equal(heroCountdownSeconds(3000, 500), 3);
    assert.equal(heroCountdownSeconds(3000, 1000), 2);
    assert.equal(heroCountdownSeconds(3000, 2000), 1);
    assert.equal(heroCountdownSeconds(3000, 2900), 1);
    assert.equal(heroCountdownSeconds(3000, 3000), 1);
  });

  it("counts down seconds for 5s auto-advance", () => {
    assert.equal(heroCountdownSeconds(5000, 0), 5);
    assert.equal(heroCountdownSeconds(5000, 500), 5);
    assert.equal(heroCountdownSeconds(5000, 1000), 4);
    assert.equal(heroCountdownSeconds(5000, 4000), 1);
    assert.equal(heroCountdownSeconds(5000, 5000), 1);
  });
});
