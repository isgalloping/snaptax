export const USER_COPY = {
  app: {
    description: "Snap receipts, auto-categorize. Simple 1099 bookkeeping.",
  },
  pwa: {
    title: "Add Snap1099 to Home Screen",
    subtitle:
      "Open like a native app — snap receipts one-handed on the job site",
    install: "Install",
    dismiss: "Not now",
  },
  camera: {
    opening: "Opening camera…",
    openFailed: "Couldn't open camera. Try again.",
    captureFailed: "Capture failed. Try again.",
    retry: "Retry",
    chooseGallery: "Choose from gallery",
    errors: {
      notAllowed:
        "Camera access is required to snap receipts. Allow camera in your browser settings.",
      notFound: "No camera found",
      notReadable: "Camera is in use by another app",
      abort: "Couldn't open camera. Try again.",
      default: "Couldn't open camera. Try again.",
    },
  },
  offline: {
    title: "You're offline",
    body: "You can still snap receipts. They'll upload when you're back online.",
    backHome: "Back to home",
  },
} as const;
