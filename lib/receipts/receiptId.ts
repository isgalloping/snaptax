import { z } from "zod";

const persistedReceiptIdSchema = z.uuid();

/** Server-persisted receipt ids are UUIDs; local-only rows (e.g. onboarding demo) are not. */
export function isPersistedReceiptId(id: string): boolean {
  return persistedReceiptIdSchema.safeParse(id).success;
}

export function assertPersistedReceiptId(id: string): void {
  if (!isPersistedReceiptId(id)) {
    throw new Error("NOT_FOUND");
  }
}

export function parseClientReceiptId(raw: FormDataEntryValue | null): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("MISSING_CLIENT_RECEIPT_ID");
  }
  if (!isPersistedReceiptId(raw)) {
    throw new Error("INVALID_CLIENT_RECEIPT_ID");
  }
  return raw;
}
