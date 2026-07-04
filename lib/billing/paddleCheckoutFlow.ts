export type PaddleCheckoutEventName =
  | "checkout.completed"
  | "checkout.closed"
  | string
  | undefined;

export type PaddleCheckoutEvent = {
  name?: PaddleCheckoutEventName;
};

export function isPaddleCheckoutCompleted(event: PaddleCheckoutEvent): boolean {
  return event.name === "checkout.completed";
}

export function isPaddleCheckoutClosed(event: PaddleCheckoutEvent): boolean {
  return event.name === "checkout.closed";
}

/** Close overlay and return to app immediately; run post-payment work without blocking UI. */
export function runPaddleCheckoutCompletedFlow(deps: {
  alreadyHandled: boolean;
  closeCheckout: () => void;
  returnToApp: () => void;
  onPaid: () => void | Promise<void>;
  onPaidError?: () => void;
}): boolean {
  if (deps.alreadyHandled) return false;

  deps.closeCheckout();
  deps.returnToApp();

  void (async () => {
    try {
      await deps.onPaid();
    } catch {
      deps.onPaidError?.();
    }
  })();

  return true;
}
