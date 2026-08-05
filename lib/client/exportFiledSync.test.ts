import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { syncExportFiledToServer } from "./exportFiledSync.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("syncExportFiledToServer", () => {
  it("posts selected receipt ids and parses the server filed timestamp as UTC", async () => {
    let request: { input: string | URL | Request; init?: RequestInit } | null = null;
    globalThis.fetch = async (input, init) => {
      request = { input, init };
      return new Response(
        JSON.stringify({
          taxSeason: "2026",
          taxSeasonDate: "2026-07-08T12:34:56.000Z",
          filedCount: 2,
          receiptIds: [
            "00000000-0000-0000-0000-000000000001",
            "00000000-0000-0000-0000-000000000002",
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const result = await syncExportFiledToServer({
      taxYear: "2026",
      receiptIds: [
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000002",
      ],
    });

    assert.ok(request);
    assert.equal(request.input, "/api/export/filed");
    assert.equal(request.init?.method, "POST");
    assert.equal(request.init?.credentials, "include");
    assert.deepEqual(JSON.parse(String(request.init?.body)), {
      taxYear: "2026",
      receiptIds: [
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000002",
      ],
    });
    assert.equal(
      (request.init?.headers as Record<string, string>)["Content-Type"],
      "application/json",
    );
    assert.equal(
      (request.init?.headers as Record<string, string>)["X-Tax-Region"],
      "us",
    );
    assert.match(
      (request.init?.headers as Record<string, string>)["X-Time-Zone"],
      /^[A-Za-z0-9_+/-]{1,64}$/,
    );

    assert.equal(result.taxSeason, "2026");
    assert.deepEqual(result.taxSeasonDate, new Date("2026-07-08T12:34:56.000Z"));
    assert.equal(result.filedCount, 2);
    assert.deepEqual(result.receiptIds, [
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000002",
    ]);
  });

  it("maps unpaid export responses to PAYMENT_REQUIRED", async () => {
    globalThis.fetch = async () => new Response(null, { status: 402 });

    await assert.rejects(
      () =>
        syncExportFiledToServer({
          taxYear: "2026",
          receiptIds: ["00000000-0000-0000-0000-000000000001"],
        }),
      (err: Error) => err.message === "PAYMENT_REQUIRED",
    );
  });

  it("preserves NO_RECEIPTS when the server filtered out every requested id", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: { code: "NO_RECEIPTS" } }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });

    await assert.rejects(
      () =>
        syncExportFiledToServer({
          taxYear: "2026",
          receiptIds: ["00000000-0000-0000-0000-000000000001"],
        }),
      (err: Error) => err.message === "NO_RECEIPTS",
    );
  });

  it("maps other validation failures to INVALID_EXPORT_TAX_YEAR", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: { code: "VALIDATION_ERROR" } }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });

    await assert.rejects(
      () =>
        syncExportFiledToServer({
          taxYear: "not-a-year",
          receiptIds: ["00000000-0000-0000-0000-000000000001"],
        }),
      (err: Error) => err.message === "INVALID_EXPORT_TAX_YEAR",
    );
  });
});
