import { createHmac } from "crypto";

import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyPaddleWebhookSignature } from "./paddleWebhook.ts";

test("verify valid Paddle webhook signature", () => {
  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  process.env.PADDLE_WEBHOOK_SECRET = "pdl_ntfset_test_secret_key_xxxxxxxx";
  const rawBody = '{"event_type":"transaction.completed"}';
  const ts = String(Math.floor(Date.now() / 1000));
  const h1 = createHmac("sha256", process.env.PADDLE_WEBHOOK_SECRET)
    .update(`${ts}:${rawBody}`)
    .digest("hex");
  const header = `ts=${ts};h1=${h1}`;

  assert.equal(verifyPaddleWebhookSignature(rawBody, header), true);
  process.env.NODE_ENV = prevEnv;
});

test("reject tampered Paddle webhook body", () => {
  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  process.env.PADDLE_WEBHOOK_SECRET = "pdl_ntfset_test_secret_key_xxxxxxxx";
  const rawBody = '{"event_type":"transaction.completed"}';
  const ts = String(Math.floor(Date.now() / 1000));
  const h1 = createHmac("sha256", process.env.PADDLE_WEBHOOK_SECRET)
    .update(`${ts}:${rawBody}`)
    .digest("hex");

  assert.equal(
    verifyPaddleWebhookSignature(rawBody + " ", `ts=${ts};h1=${h1}`),
    false,
  );
  process.env.NODE_ENV = prevEnv;
});

test("skip verify only when dev flag is set", () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSkip = process.env.PADDLE_WEBHOOK_SKIP_VERIFY;
  process.env.NODE_ENV = "development";
  process.env.PADDLE_WEBHOOK_SECRET = "abc";
  process.env.PADDLE_WEBHOOK_SKIP_VERIFY = "1";
  assert.equal(verifyPaddleWebhookSignature("{}", null), true);
  delete process.env.PADDLE_WEBHOOK_SKIP_VERIFY;
  assert.equal(verifyPaddleWebhookSignature("{}", null), false);
  process.env.NODE_ENV = prevEnv;
  process.env.PADDLE_WEBHOOK_SKIP_VERIFY = prevSkip;
});

test("placeholder secret requires signature without dev skip flag", () => {
  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  process.env.PADDLE_WEBHOOK_SECRET = "abc";
  assert.equal(verifyPaddleWebhookSignature("{}", null), false);
  process.env.NODE_ENV = prevEnv;
});
