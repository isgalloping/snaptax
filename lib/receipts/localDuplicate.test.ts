import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findLocalDuplicateBySha } from "./localDuplicate.ts";
import type { Receipt } from "@/lib/types";

const base = (id: string, sha?: string): Receipt & { contentSha256?: string } => ({
  id,
  status: "done",
  timestamp: new Date("2026-01-01T12:00:00.000Z"),
  contentSha256: sha,
});

describe("findLocalDuplicateBySha", () => {
  it("returns matching unfiled receipt", () => {
    const hit = findLocalDuplicateBySha(
      [base("a", "abc"), base("b", "def")],
      "abc",
    );
    assert.equal(hit?.id, "a");
  });

  it("excludes replaceId (resnap self)", () => {
    const hit = findLocalDuplicateBySha([base("a", "abc")], "abc", "a");
    assert.equal(hit, null);
  });

  it("ignores onboarding demo rows", () => {
    const demo = { ...base("demo", "abc"), isOnboardingDemo: true };
    assert.equal(findLocalDuplicateBySha([demo], "abc"), null);
    assert.equal(
      findLocalDuplicateBySha([demo, base("real", "abc")], "abc")?.id,
      "real",
    );
  });

  it("ignores filed receipts", () => {
    const filed = {
      ...base("f", "abc"),
      taxSeason: "2025",
      taxSeasonDate: new Date("2026-04-01T00:00:00.000Z"),
    };
    assert.equal(findLocalDuplicateBySha([filed], "abc"), null);
  });
});
