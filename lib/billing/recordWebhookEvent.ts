import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const WEBHOOK_CHANNEL_PADDLE = "paddle";

/** Terminal outcomes — Paddle retries must not re-run business logic. */
const TERMINAL_RESULTS = new Set(["applied", "ignored"]);

export type BeginWebhookEventInput = {
  channelCode: string;
  eventId: string;
  eventType: string;
  payload: Prisma.InputJsonValue;
  occurredAt?: Date | null;
  transactionId?: string | null;
  adjustmentId?: string | null;
  action?: string | null;
  adjustmentStatus?: string | null;
  processingResult?: string;
};

export type FinishWebhookEventPatch = {
  processingResult: string;
  processingReason?: string | null;
  entitlementId?: string | null;
  statusBefore?: string | null;
  statusAfter?: string | null;
  transactionId?: string | null;
  adjustmentId?: string | null;
  action?: string | null;
  adjustmentStatus?: string | null;
};

export type BeginWebhookEventResult = {
  id: string;
  duplicate: boolean;
  /** False when already finished (applied/ignored); true for new or stuck received/error. */
  shouldProcess: boolean;
};

export type WebhookEventStore = {
  findUnique: (args: {
    where: {
      channelCode_eventId: { channelCode: string; eventId: string };
    };
    select: { id: true; processingResult: true };
  }) => Promise<{ id: string; processingResult: string } | null>;
  create: (args: {
    data: Record<string, unknown>;
  }) => Promise<{ id: string }>;
  update: (args: {
    where: { id: string };
    data: Record<string, unknown>;
  }) => Promise<unknown>;
};

function normalizeChannelCode(code: string): string {
  return code.trim().toLowerCase();
}

function shouldProcessExisting(processingResult: string): boolean {
  return !TERMINAL_RESULTS.has(processingResult);
}

export async function beginWebhookEvent(
  input: BeginWebhookEventInput,
  store: WebhookEventStore = prisma.snaptaxWebhookEvent,
): Promise<BeginWebhookEventResult> {
  const channelCode = normalizeChannelCode(input.channelCode);
  const existing = await store.findUnique({
    where: {
      channelCode_eventId: { channelCode, eventId: input.eventId },
    },
    select: { id: true, processingResult: true },
  });
  if (existing) {
    return {
      id: existing.id,
      duplicate: true,
      shouldProcess: shouldProcessExisting(existing.processingResult),
    };
  }

  try {
    const created = await store.create({
      data: {
        channelCode,
        eventId: input.eventId,
        eventType: input.eventType,
        occurredAt: input.occurredAt ?? null,
        transactionId: input.transactionId ?? null,
        adjustmentId: input.adjustmentId ?? null,
        action: input.action ?? null,
        adjustmentStatus: input.adjustmentStatus ?? null,
        payload: input.payload,
        processingResult: input.processingResult ?? "received",
      },
    });
    return { id: created.id, duplicate: false, shouldProcess: true };
  } catch (err) {
    const again = await store.findUnique({
      where: {
        channelCode_eventId: { channelCode, eventId: input.eventId },
      },
      select: { id: true, processingResult: true },
    });
    if (again) {
      return {
        id: again.id,
        duplicate: true,
        shouldProcess: shouldProcessExisting(again.processingResult),
      };
    }
    throw err;
  }
}

export async function finishWebhookEvent(
  id: string,
  patch: FinishWebhookEventPatch,
  store: WebhookEventStore = prisma.snaptaxWebhookEvent,
): Promise<void> {
  await store.update({
    where: { id },
    data: {
      processingResult: patch.processingResult,
      processingReason: patch.processingReason ?? null,
      entitlementId: patch.entitlementId ?? null,
      statusBefore: patch.statusBefore ?? null,
      statusAfter: patch.statusAfter ?? null,
      ...(patch.transactionId !== undefined
        ? { transactionId: patch.transactionId }
        : {}),
      ...(patch.adjustmentId !== undefined
        ? { adjustmentId: patch.adjustmentId }
        : {}),
      ...(patch.action !== undefined ? { action: patch.action } : {}),
      ...(patch.adjustmentStatus !== undefined
        ? { adjustmentStatus: patch.adjustmentStatus }
        : {}),
    },
  });
}
