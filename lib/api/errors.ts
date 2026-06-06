import { NextResponse } from "next/server";

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function mapErrorToResponse(err: unknown) {
  const message = err instanceof Error ? err.message : "INTERNAL_ERROR";
  switch (message) {
    case "UNAUTHORIZED":
    case "INVALID_GHOST_TOKEN":
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    case "GOOGLE_LOGIN_REQUIRED":
      return apiError("GOOGLE_LOGIN_REQUIRED", "Sign in with Google to continue", 401);
    case "NOT_FOUND":
      return apiError("NOT_FOUND", "Resource not found", 404);
    case "FILE_TOO_LARGE":
      return apiError("FILE_TOO_LARGE", "File exceeds size limit", 413);
    case "INVALID_FILE_TYPE":
      return apiError("INVALID_FILE_TYPE", "Only JPEG and PNG are allowed", 415);
    case "GHOST_RECEIPT_LIMIT":
      return apiError("GHOST_RECEIPT_LIMIT", "Too many receipts for unbound ghost", 429);
    case "RATE_LIMITED":
      return apiError("RATE_LIMITED", "Too many requests", 429);
    case "PAYMENT_REQUIRED":
      return apiError("PAYMENT_REQUIRED", "Payment required", 402);
    case "NO_RECEIPTS":
      return apiError("NO_RECEIPTS", "No receipts to export", 422);
    case "BLOB_CREDENTIALS_MISSING":
      return apiError("BLOB_CREDENTIALS_MISSING", "Blob storage not configured", 500);
    default:
      return apiError("INTERNAL_ERROR", "Something went wrong", 500);
  }
}
