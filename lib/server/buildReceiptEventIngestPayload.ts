import type { Prisma } from "@prisma/client";
import type { Actor } from "@/lib/auth/getActor";
import type { IngestReceiptEventBatchInput } from "@/lib/server/ingestReceiptEventBatch";

export type ClientReceiptEvent = {
  id: string;
  receiptId: string;
  type: "RECEIPT_CREATED" | "OCR_COMPLETED" | "TAX_CALCULATED";
  payload: Record<string, unknown>;
  createdAtMs: number;
};

export function uniqueTaxCalculatedReceiptIds(
  events: ClientReceiptEvent[],
): string[] {
  return [
    ...new Set(
      events
        .filter((event) => event.type === "TAX_CALCULATED")
        .map((event) => event.receiptId),
    ),
  ];
}

export function buildReceiptEventIngestPayload(
  actor: Actor,
  events: ClientReceiptEvent[],
): IngestReceiptEventBatchInput {
  const userId = actor.kind === "user" ? actor.userId : null;
  const ghostId = actor.kind === "ghost" ? actor.ghostId : actor.ghostId ?? null;

  return {
    actor,
    rows: events.map((event) => ({
      id: event.id,
      receiptId: event.receiptId,
      userId,
      ghostId,
      eventType: event.type,
      payload: event.payload as Prisma.InputJsonValue,
      clientCreatedAt: new Date(event.createdAtMs),
    })),
    cursorEvents: events.map((event) => ({
      id: event.id,
      clientCreatedAtMs: event.createdAtMs,
    })),
    taxCalculatedEvents: events
      .filter((event) => event.type === "TAX_CALCULATED")
      .map((event) => ({
        id: event.id,
        receiptId: event.receiptId,
        payload: event.payload,
        createdAtMs: event.createdAtMs,
      })),
  };
}
