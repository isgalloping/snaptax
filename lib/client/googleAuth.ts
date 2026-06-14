"use client";

const GIS_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | null = null;

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS_LOAD_FAILED")));
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("GIS_LOAD_FAILED"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
}

export type GoogleSignInMount = {
  cleanup: () => void;
};

let gisInitializedForClient: string | null = null;
type GisCredentialHandler = {
  onCredential: (credential: string) => void;
  onError?: (error: Error) => void;
};
let activeGisHandler: GisCredentialHandler | null = null;

function ensureGisInitialized(clientId: string): void {
  if (gisInitializedForClient === clientId) return;
  if (!window.google?.accounts?.id) throw new Error("GIS_NOT_READY");

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response.credential) {
        activeGisHandler?.onCredential(response.credential);
      } else {
        activeGisHandler?.onError?.(new Error("GOOGLE_SIGN_IN_CANCELLED"));
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });
  gisInitializedForClient = clientId;
}

export async function mountGoogleSignInButton(
  container: HTMLElement,
  callbacks: {
    onCredential: (credential: string) => void;
    onError?: (error: Error) => void;
  },
): Promise<GoogleSignInMount> {
  await loadGoogleIdentityScript();
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID missing");
  if (!window.google?.accounts?.id) throw new Error("GIS_NOT_READY");

  activeGisHandler = callbacks;
  ensureGisInitialized(clientId);

  const width = Math.min(400, Math.max(240, container.clientWidth || 320));
  window.google.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    width: String(width),
    text: "continue_with",
    shape: "rectangular",
  });

  return {
    cleanup: () => {
      container.replaceChildren();
      if (activeGisHandler === callbacks) {
        activeGisHandler = null;
      }
    },
  };
}

/** @deprecated Prefer mountGoogleSignInButton inside GoogleSignInSheet */
export async function requestGoogleCredential(): Promise<string> {
  await loadGoogleIdentityScript();
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID missing");
  if (!window.google?.accounts?.id) throw new Error("GIS_NOT_READY");

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "50%";
    host.style.top = "50%";
    host.style.transform = "translate(-50%, -50%)";
    host.style.zIndex = "60";
    host.style.width = "320px";
    document.body.appendChild(host);

    void mountGoogleSignInButton(host, {
      onCredential: (credential) => {
        host.remove();
        finish(() => resolve(credential));
      },
      onError: (error) => {
        host.remove();
        finish(() => reject(error));
      },
    }).catch((error: unknown) => {
      host.remove();
      finish(() =>
        reject(error instanceof Error ? error : new Error("GIS_BUTTON_FAILED")),
      );
    });

    window.setTimeout(() => {
      host.remove();
      finish(() => reject(new Error("GOOGLE_SIGN_IN_TIMEOUT")));
    }, 120_000);
  });
}

/** @deprecated Use mapGoogleAuthErrorMessage from googleAuthErrors.ts */
export function mapGoogleAuthError(
  error: unknown,
  signInFailedMessage: string,
): string | null {
  const message = error instanceof Error ? error.message : "";
  if (message === "GOOGLE_SIGN_IN_CANCELLED") return null;
  return signInFailedMessage;
}
