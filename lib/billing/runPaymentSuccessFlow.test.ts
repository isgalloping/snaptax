import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runPaymentSuccessFlow } from "./runPaymentSuccessFlow.ts";

describe("runPaymentSuccessFlow", () => {
  it("export: confirming then ready after poll", async () => {
    const phases: string[] = [];
    await runPaymentSuccessFlow({
      variant: "export",
      season: "2027",
      onPhaseChange: (p) => phases.push(p),
      pollEntitlementReady: async () => true,
      refreshSeasonPaid: async () => {},
    });
    assert.deepEqual(phases, ["ready"]);
  });

  it("export: error when poll returns false", async () => {
    const phases: string[] = [];
    await runPaymentSuccessFlow({
      variant: "export",
      season: "2027",
      onPhaseChange: (p) => phases.push(p),
      pollEntitlementReady: async () => false,
      refreshSeasonPaid: async () => {},
    });
    assert.deepEqual(phases, ["error"]);
  });

  it("founder: ready after finalize + founder number", async () => {
    const phases: string[] = [];
    let number: number | null | undefined;
    await runPaymentSuccessFlow({
      variant: "founder",
      season: "2027",
      onPhaseChange: (p) => phases.push(p),
      onFounderNumber: (n) => {
        number = n;
      },
      pollEntitlementReady: async () => true,
      refreshSeasonPaid: async () => {},
      waitForFounderActive: async () => true,
      fetchFounderNumber: async () => 3,
    });
    assert.deepEqual(phases, ["ready"]);
    assert.equal(number, 3);
  });
});
