import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIpFromHeaders } from "./clientIp";

test("clientIpFromHeaders prefers x-real-ip when not on Vercel", () => {
  const prev = process.env.VERCEL;
  delete process.env.VERCEL;
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.1, 10.0.0.1",
    "x-real-ip": "198.51.100.9",
  });
  assert.equal(clientIpFromHeaders(headers), "198.51.100.9");
  process.env.VERCEL = prev;
});

test("clientIpFromHeaders falls back to first x-forwarded-for hop", () => {
  const prev = process.env.VERCEL;
  delete process.env.VERCEL;
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.1, 10.0.0.1",
  });
  assert.equal(clientIpFromHeaders(headers), "203.0.113.1");
  process.env.VERCEL = prev;
});
