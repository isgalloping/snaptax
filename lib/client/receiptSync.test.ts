import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RECEIPT_SYNC_LIMIT,
  top100ByUpdatedAt,
  unionMergeLWW,
} from "./receiptSync.ts";
import type { StoredReceipt } from "@/lib/storage/receiptDb";

function stored(
  id: string,
  updatedAt: string,
  overrides: Partial<StoredReceipt> = {},
): StoredReceipt {
  const date = new Date(updatedAt);
  return {
    id,
    status: "done",
    timestamp: date,
    updatedAt: date,
    ...overrides,
  };
}

test("top100ByUpdatedAt keeps newest rows", () => {
  const rows = Array.from({ length: 105 }, (_, i) =>
    stored(`r${i}`, new Date(Date.UTC(2026, 5, 1, 0, 0, i)).toISOString()),
  );
  const top = top100ByUpdatedAt(rows);
  assert.equal(top.length, RECEIPT_SYNC_LIMIT);
  assert.equal(top[0]?.id, "r104");
});

test("unionMergeLWW keeps pendingUpload local over remote", () => {
  const local = [
    stored("a", "2026-06-07T10:00:00.000Z", {
      pendingUpload: true,
      merchant: "Local",
    }),
  ];
  const remote = [
    {
      id: "a",
      status: "done" as const,
      timestamp: new Date("2026-06-07T12:00:00.000Z"),
      updatedAt: new Date("2026-06-07T12:00:00.000Z"),
      merchant: "Remote",
    },
  ];
  const merged = unionMergeLWW(local, remote);
  assert.equal(merged.find((r) => r.id === "a")?.merchant, "Local");
});

test("unionMergeLWW applies remote when newer updatedAt", () => {
  const local = [stored("a", "2026-06-07T10:00:00.000Z", { merchant: "Old" })];
  const remote = [
    {
      id: "a",
      status: "done" as const,
      timestamp: new Date("2026-06-07T08:00:00.000Z"),
      updatedAt: new Date("2026-06-07T12:00:00.000Z"),
      merchant: "New",
    },
  ];
  const merged = unionMergeLWW(local, remote);
  assert.equal(merged.find((r) => r.id === "a")?.merchant, "New");
});

test("unionMergeLWW retains local-only rows", () => {
  const local = [stored("local-only", "2026-06-07T10:00:00.000Z")];
  const merged = unionMergeLWW(local, []);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.id, "local-only");
});

test("unionMergeLWW backfills extraction when local updatedAt is newer", () => {
  const local = [
    stored("a", "2026-06-07T14:00:00.000Z", {
      merchant: undefined,
      category: undefined,
      amount: undefined,
    }),
  ];
  const remote = [
    {
      id: "a",
      status: "done" as const,
      timestamp: new Date("2026-06-07T08:00:00.000Z"),
      updatedAt: new Date("2026-06-07T12:00:00.000Z"),
      merchant: "Home Depot",
      category: "OTHER",
      amount: 14.75,
    },
  ];
  const merged = unionMergeLWW(local, remote);
  const row = merged.find((r) => r.id === "a");
  assert.equal(row?.merchant, "Home Depot");
  assert.equal(row?.category, "OTHER");
  assert.equal(row?.amount, 14.75);
  assert.equal(row?.updatedAt?.toISOString(), "2026-06-07T14:00:00.000Z");
});

test("unionMergeLWW applies filed fields when remote is newer after export", () => {
  const local = [stored("a", "2026-06-07T10:00:00.000Z", { taxAmount: 10 })];
  const filedAt = new Date("2026-06-07T14:00:00.000Z");
  const remote = [
    {
      id: "a",
      status: "done" as const,
      timestamp: new Date("2026-06-07T08:00:00.000Z"),
      updatedAt: filedAt,
      taxAmount: 10,
      taxSeason: "2026",
      taxSeasonDate: filedAt,
    },
  ];
  const merged = unionMergeLWW(local, remote);
  const row = merged.find((r) => r.id === "a");
  assert.equal(row?.taxSeason, "2026");
  assert.equal(row?.taxSeasonDate?.toISOString(), filedAt.toISOString());
});

test("unionMergeLWW backfills filed when local updatedAt ties remote", () => {
  const tiedAt = "2026-06-07T12:00:00.000Z";
  const filedAt = new Date("2026-06-07T14:00:00.000Z");
  const local = [stored("a", tiedAt, { taxAmount: 10 })];
  const remote = [
    {
      id: "a",
      status: "done" as const,
      timestamp: new Date(tiedAt),
      updatedAt: new Date(tiedAt),
      taxAmount: 10,
      taxSeason: "2026",
      taxSeasonDate: filedAt,
    },
  ];
  const merged = unionMergeLWW(local, remote);
  const row = merged.find((r) => r.id === "a");
  assert.equal(row?.taxSeason, "2026");
  assert.equal(row?.taxSeasonDate?.toISOString(), filedAt.toISOString());
});
