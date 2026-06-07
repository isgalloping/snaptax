import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatLocalDate,
  formatLocalDateTime,
  formatReceiptDetailDateTime,
  formatReceiptTime,
} from "@/lib/format";

test("formatLocalDate uses IANA timezone for calendar day (US)", () => {
  const instant = new Date("2026-06-07T03:00:00.000Z");
  assert.equal(formatLocalDate(instant, "UTC", "us"), "06/07/2026");
  assert.equal(formatLocalDate(instant, "America/New_York", "us"), "06/06/2026");
});

test("formatLocalDate uses EU day/month order", () => {
  const instant = new Date("2026-06-07T03:00:00.000Z");
  assert.equal(formatLocalDate(instant, "UTC", "eu"), "07/06/2026");
});

test("formatLocalDateTime uses 12h US and 24h EU", () => {
  const instant = new Date("2026-06-07T06:00:00.000Z");
  const us = formatLocalDateTime(instant, "America/New_York", "us");
  assert.match(us, /^06\/07\/2026,/);
  assert.match(us, /2:00 AM/);

  const eu = formatLocalDateTime(instant, "America/New_York", "eu");
  assert.match(eu, /^07\/06\/2026,/);
  assert.match(eu, /2:00/);
  assert.doesNotMatch(eu, /AM|PM/);
});

test("formatReceiptDetailDateTime follows region conventions", () => {
  const instant = new Date("2026-06-07T15:30:00.000Z");
  const us = formatReceiptDetailDateTime(instant, "us");
  assert.match(us, /^\d{2}\/\d{2}\/\d{4},/);
  assert.match(us, /:\d{2} (AM|PM)$/);

  const eu = formatReceiptDetailDateTime(instant, "eu");
  assert.match(eu, /^\d{2}\/\d{2}\/\d{4},/);
  assert.match(eu, /:\d{2}$/);
  assert.doesNotMatch(eu, /AM|PM/);
});

test("formatReceiptTime includes clock on Yesterday", () => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(14, 30, 0, 0);

  const formatted = formatReceiptTime(yesterday, "us");
  assert.match(formatted, /^Yesterday, /);
  assert.match(formatted, /:\d{2} (AM|PM)$/);
});
