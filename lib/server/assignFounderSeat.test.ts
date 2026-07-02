import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FOUNDER_SEATS_TOTAL } from "@/lib/founder/types";
import { assignFounderSeatOnFirstPurchase } from "./assignFounderSeat.ts";

describe("assignFounderSeatOnFirstPurchase", () => {
  it("assigns the first seat when user has no founder number", async () => {
    const assignCalls: Array<{
      userId: string;
      founderNumber: number;
      founderTier: string;
    }> = [];
    const lockedAt = new Date("2026-06-13T12:00:00.000Z");

    const result = await assignFounderSeatOnFirstPurchase(
      "user-1",
      {
        runTransaction: async (fn) => fn(),
        findUser: async () => ({ founderNumber: null }),
        countClaimedSeats: async () => 0,
        assignSeat: async (userId, data) => {
          assignCalls.push({
            userId,
            founderNumber: data.founderNumber,
            founderTier: data.founderTier,
          });
        },
        now: () => lockedAt,
      },
    );

    assert.deepEqual(result, {
      assigned: true,
      founderNumber: 1,
      tier: "FOUNDER_LEVEL_SUPER",
    });
    assert.deepEqual(assignCalls, [
      {
        userId: "user-1",
        founderNumber: 1,
        founderTier: "FOUNDER_LEVEL_SUPER",
      },
    ]);
  });

  it("returns unassigned when the program is full", async () => {
    const assignCalls: string[] = [];

    const result = await assignFounderSeatOnFirstPurchase(
      "user-2",
      {
        runTransaction: async (fn) => fn(),
        findUser: async () => ({ founderNumber: null }),
        countClaimedSeats: async () => FOUNDER_SEATS_TOTAL,
        assignSeat: async () => {
          assignCalls.push("assign");
        },
        now: () => new Date("2026-06-13T12:00:00.000Z"),
      },
    );

    assert.deepEqual(result, {
      assigned: false,
      founderNumber: null,
      tier: null,
      seatUnavailable: true,
    });
    assert.deepEqual(assignCalls, []);
  });

  it("is idempotent when user already has a founder number", async () => {
    const assignCalls: string[] = [];
    const countCalls: string[] = [];

    const result = await assignFounderSeatOnFirstPurchase(
      "user-3",
      {
        runTransaction: async (fn) => fn(),
        findUser: async () => ({ founderNumber: 5 }),
        countClaimedSeats: async () => {
          countCalls.push("count");
          return 5;
        },
        assignSeat: async () => {
          assignCalls.push("assign");
        },
        now: () => new Date("2026-06-13T12:00:00.000Z"),
      },
    );

    assert.deepEqual(result, {
      assigned: false,
      founderNumber: 5,
      tier: "FOUNDER_LEVEL_SUPER",
    });
    assert.deepEqual(countCalls, []);
    assert.deepEqual(assignCalls, []);
  });

  it("retries after founder_number unique conflict when program becomes full", async () => {
    let assignAttempts = 0;
    const { Prisma } = await import("@prisma/client");

    const result = await assignFounderSeatOnFirstPurchase("user-race", {
      runTransaction: async (fn) => fn(),
      findUser: async () => ({ founderNumber: null }),
      countClaimedSeats: async () => (assignAttempts === 0 ? 49 : 50),
      assignSeat: async () => {
        assignAttempts++;
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "test",
          meta: { target: ["founder_number"] },
        });
      },
      now: () => new Date("2026-06-13T12:00:00.000Z"),
    });

    assert.equal(result.assigned, false);
    assert.equal(result.founderNumber, null);
    assert.equal(result.seatUnavailable, true);
    assert.equal(assignAttempts, 1);
  });
});
