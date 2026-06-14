/** Client-side Google auth error codes from POST /api/auth/google. */

export class GoogleAuthError extends Error {
  readonly code: string;

  constructor(code: string, message = code) {
    super(message);
    this.name = "GoogleAuthError";
    this.code = code;
  }
}

export type GoogleAuthErrorMessages = {
  signInFailed: string;
  signInUnauthorized: string;
  signInGhostBound: string;
  signInServerError: string;
  signInConfig: string;
  ghostRegisterFailed: string;
};

export function mapGoogleAuthErrorMessage(
  error: unknown,
  messages: GoogleAuthErrorMessages,
): string | null {
  if (error instanceof GoogleAuthError) {
    switch (error.code) {
      case "UNAUTHORIZED":
        return messages.signInUnauthorized;
      case "GHOST_ALREADY_BOUND":
        return messages.signInGhostBound;
      case "INTERNAL_ERROR":
        return messages.signInServerError;
      default:
        return messages.signInFailed;
    }
  }

  const message = error instanceof Error ? error.message : "";
  if (message === "GOOGLE_SIGN_IN_CANCELLED") return null;
  if (message === "GOOGLE_CLIENT_ID missing") return messages.signInConfig;
  if (message === "ghost register failed") return messages.ghostRegisterFailed;
  if (
    message === "GIS_LOAD_FAILED" ||
    message === "GIS_NOT_READY" ||
    message === "GIS_BUTTON_FAILED" ||
    message === "GOOGLE_SIGN_IN_TIMEOUT"
  ) {
    return messages.signInFailed;
  }

  return messages.signInFailed;
}
