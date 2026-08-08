import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  recalcReceiptsInBackground,
  taxRecalcReceiptWhere,
} from "./taxRecalcQueue.ts";
import { unfiledReceiptWhere } from "./filedStatus.ts";
import type { LogEntry } from "@/lib/server/log/types";

describe("taxRecalcReceiptWhere", () => {
  it("only selects unfiled done/processing receipts for a user", () => {
    assert.deepEqual(taxRecalcReceiptWhere("user-1"), {
      userId: "user-1",
      status: { in: ["done", "processing"] },
      ...unfiledReceiptWhere(),
    });
  });
});

describe("recalcReceiptsInBackground", () => {
  it("does not reset or process a receipt when its blob is unreadable", async () => {
    const calls: string[] = [];
    const logEvents: LogEntry[] = [];

    await recalcReceiptsInBackground(
      [{ id: "receipt-1", imageUrl: "photos/receipt-1.jpg", status: "done" }],
      "us",
      null,
      {
        getBlob: async (pathname) => {
          calls.push(`get:${pathname}`);
          return { statusCode: 404, stream: null };
        },
        resetReceiptForRecalc: async (receiptId) => {
          calls.push(`reset:${receiptId}`);
          return { count: 1 };
        },
        processReceipt: async () => {
          calls.push("process");
        },
        log: (event) => {
          logEvents.push(event);
        },
      },
    );

    assert.deepEqual(calls, ["get:photos/receipt-1.jpg"]);
    assert.equal(logEvents[0]?.meta?.reason, "recalc_blob_unreadable");
    assert.equal(logEvents[0]?.meta?.errorMessage, "blob_status_404");
  });

  it("does not reset or process a receipt when its blob bytes are not a valid receipt image", async () => {
    const calls: string[] = [];
    const logEvents: LogEntry[] = [];
    const invalidBytes = Uint8Array.from([0x00, 0x01, 0x02, 0x03]);

    await recalcReceiptsInBackground(
      [{ id: "receipt-invalid", imageUrl: "photos/invalid.bin", status: "done" }],
      "us",
      null,
      {
        getBlob: async (pathname) => {
          calls.push(`get:${pathname}`);
          return { statusCode: 200, stream: new Response(invalidBytes).body };
        },
        resetReceiptForRecalc: async (receiptId) => {
          calls.push(`reset:${receiptId}`);
          return { count: 1 };
        },
        processReceipt: async () => {
          calls.push("process");
        },
        log: (event) => {
          logEvents.push(event);
        },
      },
    );

    assert.deepEqual(calls, ["get:photos/invalid.bin"]);
    assert.equal(logEvents[0]?.level, "error");
    assert.equal(logEvents[0]?.meta?.receiptId, "receipt-invalid");
    assert.equal(logEvents[0]?.meta?.errorMessage, "INVALID_FILE_TYPE");
  });

  it("resets the receipt only after reading a valid blob, then reprocesses tax", async () => {
    const calls: string[] = [];
    const pngBytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x01]);

    await recalcReceiptsInBackground(
      [{ id: "receipt-2", imageUrl: "photos/receipt-2.png", status: "done" }],
      "eu",
      "rideshare",
      {
        getBlob: async (pathname) => {
          calls.push(`get:${pathname}`);
          return { statusCode: 200, stream: new Response(pngBytes).body };
        },
        resetReceiptForRecalc: async (receiptId) => {
          calls.push(`reset:${receiptId}`);
          return { count: 1 };
        },
        processReceipt: async (params) => {
          calls.push(
            `process:${params.receiptId}:${params.mime}:${params.dataRegion}:${params.industry}`,
          );
          assert.deepEqual([...params.imageBuffer], [...pngBytes]);
        },
        log: () => {},
      },
    );

    assert.deepEqual(calls, [
      "get:photos/receipt-2.png",
      "reset:receipt-2",
      "process:receipt-2:image/png:eu:rideshare",
    ]);
  });

  it("skips tax processing when the reset no longer matches an unfiled receipt", async () => {
    const calls: string[] = [];
    const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0x01]);

    await recalcReceiptsInBackground(
      [
        {
          id: "receipt-filed",
          imageUrl: "photos/receipt-filed.jpg",
          status: "done",
        },
      ],
      "us",
      null,
      {
        getBlob: async (pathname) => {
          calls.push(`get:${pathname}`);
          return { statusCode: 200, stream: new Response(jpegBytes).body };
        },
        resetReceiptForRecalc: async (receiptId) => {
          calls.push(`reset:${receiptId}`);
          return { count: 0 };
        },
        processReceipt: async () => {
          calls.push("process");
        },
        log: () => {},
      },
    );

    assert.deepEqual(calls, [
      "get:photos/receipt-filed.jpg",
      "reset:receipt-filed",
    ]);
  });
});
