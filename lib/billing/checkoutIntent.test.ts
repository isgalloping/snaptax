import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHECKOUT_INTENT_TTL_MS,
  allowPaddleLegacyUserIdGrant,
  createOrReuseCheckoutIntent,
  evaluateIntentGrant,
  isCheckoutIntentExpired,
  shouldReuseCheckoutIntentBySkuTier,
} from "./checkoutIntent.ts";

const baseIntent = {
  id: "intent-1",
  userId: "user-1",
  taxSeason: "2026",
  status: "pending",
  expiresAt: new Date("2026-06-13T12:00:00.000Z"),
};

describe("checkoutIntent helpers", () => {
  it("defines 15 minute TTL", () => {
    assert.equal(CHECKOUT_INTENT_TTL_MS, 15 * 60 * 1000);
  });

  it("detects expired intents", () => {
    const now = new Date("2026-06-13T12:00:00.000Z");
    const expiresAt = new Date("2026-06-13T11:59:59.000Z");
    assert.equal(isCheckoutIntentExpired(expiresAt, now), true);
    assert.equal(
      isCheckoutIntentExpired(new Date("2026-06-13T12:00:01.000Z"), now),
      false,
    );
  });
});

describe("shouldReuseCheckoutIntentBySkuTier", () => {
  it("reuses when both tiers are null/default", () => {
    assert.equal(shouldReuseCheckoutIntentBySkuTier(null), true);
    assert.equal(shouldReuseCheckoutIntentBySkuTier(null, undefined), true);
  });

  it("reuses when existing and requested tiers match", () => {
    assert.equal(
      shouldReuseCheckoutIntentBySkuTier("FOUNDER", "FOUNDER"),
      true,
    );
  });

  it("does not reuse when tiers differ", () => {
    assert.equal(shouldReuseCheckoutIntentBySkuTier(null, "FOUNDER"), false);
    assert.equal(
      shouldReuseCheckoutIntentBySkuTier("DEFAULT", "FOUNDER"),
      false,
    );
    assert.equal(shouldReuseCheckoutIntentBySkuTier("FOUNDER"), false);
  });
});

describe("createOrReuseCheckoutIntent sku tier reuse", () => {
  it("reuses pending intent only when sku tier matches", async () => {
    const existing = {
      id: "intent-existing",
      expiresAt: new Date("2026-06-13T12:10:00.000Z"),
      skuTier: "FOUNDER" as string | null,
    };
    const created: Array<{ skuTier: string | null }> = [];

    const deps = {
      findFirst: async () => existing,
      create: async (data: { skuTier: string | null }) => {
        created.push(data);
        return {
          id: "intent-new",
          expiresAt: new Date("2026-06-13T12:15:00.000Z"),
        };
      },
      now: () => new Date("2026-06-13T12:00:00.000Z"),
    };

    const reused = await createOrReuseCheckoutIntent(
      "user-1",
      "2026",
      "FOUNDER",
      deps,
    );
    assert.deepEqual(reused, {
      intentId: "intent-existing",
      expiresAt: existing.expiresAt,
    });
    assert.equal(created.length, 0);

    const freshDeps = {
      ...deps,
      findFirst: async () => ({
        ...existing,
        skuTier: "FOUNDER",
      }),
    };

    const fresh = await createOrReuseCheckoutIntent(
      "user-1",
      "2026",
      "DEFAULT",
      freshDeps,
    );
    assert.equal(fresh.intentId, "intent-new");
    assert.equal(created.length, 1);
    assert.equal(created[0]?.skuTier, "DEFAULT");
  });
});

describe("evaluateIntentGrant", () => {
  const now = new Date("2026-06-13T12:00:00.000Z");

  it("grants pending intents before expiry", () => {
    const result = evaluateIntentGrant(
      {
        ...baseIntent,
        expiresAt: new Date("2026-06-13T12:00:01.000Z"),
      },
      now,
    );
    assert.deepEqual(result, { ok: true, intentExpiredAtGrant: false });
  });

  it("grants expired pending intents with late-payment flag", () => {
    const result = evaluateIntentGrant(
      {
        ...baseIntent,
        expiresAt: new Date("2026-06-13T11:59:59.000Z"),
      },
      now,
    );
    assert.deepEqual(result, { ok: true, intentExpiredAtGrant: true });
  });

  it("grants expired intents already marked expired", () => {
    const result = evaluateIntentGrant(
      {
        ...baseIntent,
        status: "expired",
        expiresAt: new Date("2026-06-13T11:59:59.000Z"),
      },
      now,
    );
    assert.deepEqual(result, { ok: true, intentExpiredAtGrant: true });
  });

  it("rejects consumed intents", () => {
    const result = evaluateIntentGrant(
      {
        ...baseIntent,
        status: "consumed",
        expiresAt: new Date("2026-06-13T12:00:01.000Z"),
      },
      now,
    );
    assert.deepEqual(result, { ok: false, reason: "intent_not_pending" });
  });
});

describe("allowPaddleLegacyUserIdGrant", () => {
  it("allows legacy outside production", () => {
    assert.equal(
      allowPaddleLegacyUserIdGrant({
        VERCEL_ENV: "preview",
        NODE_ENV: "production",
      }),
      true,
    );
    assert.equal(
      allowPaddleLegacyUserIdGrant({
        NODE_ENV: "development",
      }),
      true,
    );
  });

  it("blocks legacy in Vercel production", () => {
    assert.equal(
      allowPaddleLegacyUserIdGrant({
        VERCEL_ENV: "production",
        NODE_ENV: "production",
      }),
      false,
    );
  });

  it("blocks legacy in production NODE_ENV without VERCEL_ENV", () => {
    assert.equal(
      allowPaddleLegacyUserIdGrant({
        NODE_ENV: "production",
      }),
      false,
    );
  });

  it("allows override via ALLOW_PADDLE_LEGACY_USER_ID=1", () => {
    assert.equal(
      allowPaddleLegacyUserIdGrant({
        VERCEL_ENV: "production",
        NODE_ENV: "production",
        ALLOW_PADDLE_LEGACY_USER_ID: "1",
      }),
      true,
    );
  });
});
