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

    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        finish(() => {
          if (response.credential) resolve(response.credential);
          else reject(new Error("GOOGLE_SIGN_IN_CANCELLED"));
        });
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "50%";
    host.style.top = "50%";
    host.style.transform = "translate(-50%, -50%)";
    host.style.zIndex = "60";
    host.style.width = "1px";
    host.style.height = "1px";
    host.style.overflow = "hidden";
    document.body.appendChild(host);

    window.google!.accounts.id.renderButton(host, {
      type: "standard",
      theme: "outline",
      size: "large",
    });

    const button = host.querySelector("div[role=button]") as HTMLElement | null;
    if (!button) {
      host.remove();
      reject(new Error("GIS_BUTTON_FAILED"));
      return;
    }

    button.click();
    window.setTimeout(() => {
      host.remove();
      finish(() => reject(new Error("GOOGLE_SIGN_IN_TIMEOUT")));
    }, 120_000);
  });
}
