import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildVerifyContext } from "./buildVerifyContext";
import type { Actor } from "@/lib/auth/getActor";

const userActor: Actor = {
  kind: "user",
  userId: "u1",
  email: "test@example.com",
};
const ghostActor: Actor = { kind: "ghost", ghostId: "g1", bound: false };

const verifyFlags = {
  runModel: "verify",
  verfyUser: "test@example.com",
  isNeedPay: false,
  isMockAI: true,
};

describe("buildVerifyContext", () => {
  it("allows full bypass for whitelisted user in verify mode", () => {
    const ctx = buildVerifyContext(userActor, verifyFlags);
    assert.equal(ctx.canBypass, true);
    assert.equal(ctx.canBypassPay, true);
    assert.equal(ctx.canMockAi, true);
  });

  it("matches email case-insensitively", () => {
    const ctx = buildVerifyContext(
      { ...userActor, email: "Test@Example.com" },
      verifyFlags,
    );
    assert.equal(ctx.canBypass, true);
  });

  it("blocks ghost actors", () => {
    const ctx = buildVerifyContext(ghostActor, verifyFlags);
    assert.equal(ctx.canBypass, false);
    assert.equal(ctx.canMockAi, false);
  });

  it("blocks when runModel is production", () => {
    const ctx = buildVerifyContext(userActor, {
      ...verifyFlags,
      runModel: "production",
    });
    assert.equal(ctx.canBypass, false);
  });

  it("blocks non-whitelist email", () => {
    const ctx = buildVerifyContext(
      { ...userActor, email: "other@example.com" },
      verifyFlags,
    );
    assert.equal(ctx.canBypass, false);
  });

  it("requires isNeedPay false for pay bypass", () => {
    const ctx = buildVerifyContext(userActor, {
      ...verifyFlags,
      isNeedPay: true,
    });
    assert.equal(ctx.canBypassPay, false);
  });

  it("blocks verify bypass on production platform even when flags allow", () => {
    const prev = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = "production";
    const ctx = buildVerifyContext(userActor, verifyFlags);
    assert.equal(ctx.canBypass, false);
    assert.equal(ctx.canBypassPay, false);
    assert.equal(ctx.canMockAi, false);
    process.env.VERCEL_ENV = prev;
  });

  it("allows verify bypass on preview platform", () => {
    const prev = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = "preview";
    const ctx = buildVerifyContext(userActor, verifyFlags);
    assert.equal(ctx.canBypass, true);
    process.env.VERCEL_ENV = prev;
  });
});
