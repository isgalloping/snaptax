import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveExportCardState } from "@/lib/settings/resolveExportCardState";

const nearDeadline = new Date("2027-04-10T12:00:00.000Z");
const farFromDeadline = new Date("2027-03-01T12:00:00.000Z");

describe("resolveExportCardState", () => {
  it("P1 anonymous", () => {
    assert.equal(
      resolveExportCardState({
        isSignedIn: false,
        seasonPaid: false,
        currentSeason: "2027",
        hasSeasonExportDone: false,
        now: farFromDeadline,
      }),
      "anon",
    );
  });

  it("P2 signed-in unpaid", () => {
    assert.equal(
      resolveExportCardState({
        isSignedIn: true,
        seasonPaid: false,
        currentSeason: "2027",
        hasSeasonExportDone: false,
        now: farFromDeadline,
      }),
      "unpaid",
    );
  });

  it("P3 paid not exported", () => {
    assert.equal(
      resolveExportCardState({
        isSignedIn: true,
        seasonPaid: true,
        currentSeason: "2027",
        hasSeasonExportDone: false,
        now: farFromDeadline,
      }),
      "paid_new",
    );
  });

  it("P4 paid exported", () => {
    assert.equal(
      resolveExportCardState({
        isSignedIn: true,
        seasonPaid: true,
        currentSeason: "2027",
        hasSeasonExportDone: true,
        now: farFromDeadline,
      }),
      "paid_exported",
    );
  });

  it("P0 overrides paid states within 7 days", () => {
    assert.equal(
      resolveExportCardState({
        isSignedIn: true,
        seasonPaid: true,
        currentSeason: "2027",
        hasSeasonExportDone: true,
        now: nearDeadline,
      }),
      "final_deadline",
    );
  });

  it("P0 does not apply to unpaid", () => {
    assert.equal(
      resolveExportCardState({
        isSignedIn: true,
        seasonPaid: false,
        currentSeason: "2027",
        hasSeasonExportDone: false,
        now: nearDeadline,
      }),
      "unpaid",
    );
  });
});
