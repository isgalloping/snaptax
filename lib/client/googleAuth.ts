"use client";

const GIS_SRC = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<void> | null = null;

function gisReady(): boolean {
  return Boolean(window.google?.accounts?.id);
}

function waitForGisReady(timeoutMs = 10_000): Promise<void> {
  if (gisReady()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (gisReady()) {
        resolve();
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        reject(new Error("GIS_NOT_READY"));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (gisReady()) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const finishReady = () => {
      void waitForGisReady().then(resolve).catch(reject);
    };

    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      if (gisReady()) {
        resolve();
        return;
      }
      existing.addEventListener("load", finishReady, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("GIS_LOAD_FAILED")),
        { once: true },
      );
      queueMicrotask(finishReady);
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = finishReady;
    script.onerror = () => reject(new Error("GIS_LOAD_FAILED"));
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
}

async function waitForContainerWidth(container: HTMLElement): Promise<number> {
  for (let i = 0; i < 20; i++) {
    const width = container.clientWidth;
    if (width > 0) return width;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  return container.clientWidth || 320;
}

export type GoogleSignInMount = {
  cleanup: () => void;
};

async function waitForRenderedButton(
  container: HTMLElement,
  timeoutMs = 5_000,
): Promise<void> {
  for (let elapsed = 0; elapsed < timeoutMs; elapsed += 50) {
    const hasRenderedChild =
      container.querySelector('[role="button"]') != null ||
      container.querySelector("iframe") != null ||
      container.childElementCount > 0;
    if (hasRenderedChild && container.offsetHeight > 0) return;
    await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
  }
  throw new Error("GIS_BUTTON_FAILED");
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
  if (!gisReady()) throw new Error("GIS_NOT_READY");

  window.google!.accounts.id.cancel();
  container.replaceChildren();

  window.google!.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response.credential) {
        callbacks.onCredential(response.credential);
      } else {
        callbacks.onError?.(new Error("GOOGLE_SIGN_IN_CANCELLED"));
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_button: false,
  });

  const width = Math.min(400, Math.max(240, await waitForContainerWidth(container)));
  window.google!.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    width: String(width),
    text: "continue_with",
    shape: "rectangular",
  });

  await waitForRenderedButton(container);

  return {
    cleanup: () => {
      window.google?.accounts.id.cancel();
      container.replaceChildren();
    },
  };
}

/** @deprecated Prefer mountGoogleSignInButton inside GoogleSignInSheet */
export async function requestGoogleCredential(): Promise<string> {
  await loadGoogleIdentityScript();
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID missing");
  if (!gisReady()) throw new Error("GIS_NOT_READY");

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

export function mapGoogleAuthError(
  error: unknown,
  signInFailedMessage: string,
): string | null {
  const message = error instanceof Error ? error.message : "";
  if (message === "GOOGLE_SIGN_IN_CANCELLED") return null;
  if (
    message === "GOOGLE_CLIENT_ID missing" ||
    message === "GIS_LOAD_FAILED" ||
    message === "GIS_NOT_READY" ||
    message === "GIS_BUTTON_FAILED" ||
    message === "GOOGLE_SIGN_IN_TIMEOUT" ||
    message === "ghost register failed" ||
    message === "GOOGLE_AUTH_FAILED" ||
    message === "UNAUTHORIZED" ||
    message === "INVALID_GOOGLE_TOKEN" ||
    message === "GHOST_ALREADY_BOUND"
  ) {
    return signInFailedMessage;
  }
  return signInFailedMessage;
}
