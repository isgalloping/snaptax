import { NextResponse } from "next/server";
import { setPendingError } from "@/lib/server/log/requestLogContext";
import type { LogMeta } from "@/lib/server/log/types";

export type ResolvedApiError = {
  code: string;
  clientMessage: string;
  status: number;
};

export function resolveApiError(err: unknown): ResolvedApiError {
  const message = err instanceof Error ? err.message : "INTERNAL_ERROR";
  switch (message) {
    case "UNAUTHORIZED":
    case "INVALID_GHOST_TOKEN":
      return {
        code: "UNAUTHORIZED",
        clientMessage: "Authentication required",
        status: 401,
      };
    case "INVALID_GOOGLE_TOKEN":
      return {
        code: "INVALID_GOOGLE_TOKEN",
        clientMessage: "Google sign-in token invalid",
        status: 401,
      };
    case "GHOST_ALREADY_BOUND":
      return {
        code: "GHOST_ALREADY_BOUND",
        clientMessage: "This device is already linked to another account",
        status: 409,
      };
    case "GOOGLE_LOGIN_REQUIRED":
      return {
        code: "GOOGLE_LOGIN_REQUIRED",
        clientMessage: "Sign in with Google to continue",
        status: 401,
      };
    case "NOT_FOUND":
      return {
        code: "NOT_FOUND",
        clientMessage: "Resource not found",
        status: 404,
      };
    case "FILE_TOO_LARGE":
      return {
        code: "FILE_TOO_LARGE",
        clientMessage: "File exceeds size limit",
        status: 413,
      };
    case "INVALID_FILE_TYPE":
      return {
        code: "INVALID_FILE_TYPE",
        clientMessage: "Only JPEG and PNG are allowed",
        status: 415,
      };
    case "MISSING_CLIENT_RECEIPT_ID":
      return {
        code: "MISSING_CLIENT_RECEIPT_ID",
        clientMessage: "clientReceiptId is required",
        status: 400,
      };
    case "INVALID_CLIENT_RECEIPT_ID":
      return {
        code: "INVALID_CLIENT_RECEIPT_ID",
        clientMessage: "clientReceiptId must be a UUID",
        status: 400,
      };
    case "DUPLICATE_RECEIPT":
      return {
        code: "DUPLICATE_RECEIPT",
        clientMessage: "This receipt is already in your list",
        status: 409,
      };
    case "INVALID_INDUSTRY":
      return {
        code: "INVALID_INDUSTRY",
        clientMessage: "Invalid industry selection",
        status: 400,
      };
    case "GHOST_RECEIPT_LIMIT":
      return {
        code: "GHOST_RECEIPT_LIMIT",
        clientMessage: "Too many receipts for unbound ghost",
        status: 429,
      };
    case "RATE_LIMITED":
      return {
        code: "RATE_LIMITED",
        clientMessage: "Too many requests",
        status: 429,
      };
    case "PAYMENT_REQUIRED":
      return {
        code: "PAYMENT_REQUIRED",
        clientMessage: "Payment required",
        status: 402,
      };
    case "NO_RECEIPTS":
      return {
        code: "NO_RECEIPTS",
        clientMessage: "No receipts to export",
        status: 422,
      };
    case "BLOB_CREDENTIALS_MISSING":
      return {
        code: "BLOB_CREDENTIALS_MISSING",
        clientMessage: "Blob storage not configured",
        status: 500,
      };
    case "OPENAI_EMPTY":
    case "OPENAI_TIMEOUT":
      return {
        code: "OPENAI_UNAVAILABLE",
        clientMessage: "Receipt analysis is temporarily unavailable",
        status: 503,
      };
    default:
      return {
        code: "INTERNAL_ERROR",
        clientMessage: "Something went wrong",
        status: 500,
      };
  }
}

export function buildErrorMeta(err: unknown): LogMeta {
  const resolved = resolveApiError(err);
  const raw =
    err instanceof Error ? err.message : typeof err === "string" ? err : "unknown";
  return {
    errorCode: resolved.code,
    errorMessage: raw.slice(0, 120),
  };
}

export function apiError(
  code: string,
  message: string,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

export function rateLimitError(retryAfterSec: number) {
  return apiError("RATE_LIMITED", "Too many requests", 429, {
    "Retry-After": String(retryAfterSec),
  });
}

export function mapErrorToResponse(err: unknown) {
  setPendingError(err);
  const resolved = resolveApiError(err);
  return apiError(resolved.code, resolved.clientMessage, resolved.status);
}
