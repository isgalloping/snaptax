export const USER_COPY = {
  app: {
    description: "Snap receipts, auto-categorize. Simple 1099 bookkeeping.",
  },
  pwa: {
    title: "Add Snap1099 to Home Screen",
    subtitle:
      "Open like a native app — snap receipts one-handed on the job site",
    install: "Install",
    howToInstall: "How to add",
    dismiss: "Not now",
    manualHint: "Tap ⋮ in Chrome, then Install app",
    manualSheetTitle: "Install Snap1099",
    manualSheetLead:
      "Your browser can't install automatically — follow these steps:",
    manualGotIt: "Got it",
    manualSteps: {
      chromiumAndroid: [
        "Tap the ⋮ menu (top-right of Chrome).",
        'Tap "Install app" or "Add to Home screen".',
        "Confirm — Snap1099 opens from your home screen like a native app.",
      ],
      chromiumDesktop: [
        "Tap the ⋮ menu (top-right of Chrome or Edge).",
        'Tap "Apps" → "Install Snap1099" (or "Install this site").',
        "Confirm — Snap1099 opens in its own window.",
      ],
      iosSafari: [
        "Tap the Share button (square with arrow) at the bottom of Safari.",
        'Scroll and tap "Add to Home Screen".',
        'Tap "Add" — open Snap1099 from your home screen.',
      ],
      macosSafari: [
        "Tap the Share button in Safari's toolbar.",
        'Choose "Add to Dock".',
        "Snap1099 appears in your Dock like a native app.",
      ],
    },
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
