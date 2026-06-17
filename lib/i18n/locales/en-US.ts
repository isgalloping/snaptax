import type { UserCopy } from "../types";

export const EN_US_COPY: UserCopy = {
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
      dismissInstallAria: "Dismiss install instructions",
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
      takePhoto: "Take Photo",
      takePhotoAria: "Take photo",
      flashDoneLine1: "Flash",
      flashDoneLine2: "Done",
      flashDoneAria: "Flash done",
      doneReviewLine1: "Done",
      doneReviewLine2: "Review",
      doneReviewAria: "Done and review",
      batchReviewAria: "Review latest batch",
      batchLabel: "Batch {count}",
      review: {
        delete: "Delete",
        deleteReceipt: "Delete receipt",
        deleteFromBatch: "Delete receipt from batch",
        resnap: "Resnap",
        resnapReceipt: "Resnap receipt",
        done: "Done",
        acceptReceipt: "Accept receipt",
      },
      gallery: {
        latest: "Latest receipt photo",
        selected: "Selected receipt photo",
        accepted: "Accepted receipt photo",
        default: "Receipt photo",
      },
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
      label: "OFFLINE",
      title: "You're offline",
      body: "You can still snap receipts. They'll upload when you're back online.",
      backHome: "Back to home",
    },
    onboarding: {
      landing: {
        headlineLead: "Keep More of Your",
        headlineAccent: "Hard Earned Money.",
        tagline: "AI finds tax deductions others miss.",
        check1: "Works Offline",
        check2: "10 Receipts in 10 Sec",
        check3: "No Signup Needed",
        cta: "Let's Go! ⚡",
        ctaCountdown: "Let's Go! ({seconds})",
        ctaAria: "Start onboarding",
        ariaStatus: "Loading Snap1099",
      },
      snapCoach: "Tap SNAP RECEIPT — photo any work receipt.",
      dismissCoach: "Dismiss hint",
      skip: "Skip",
      skipAria: "Skip onboarding tutorial",
      firstReceipt: {
        processing: "Reading your receipt… Snap more anytime.",
        done: "Added! Est. Tax Saved updates at the top.",
        blurry: "Too blurry — tap the row to resnap.",
      },
      googleNudge: "New phone? Sign in with Google to save your receipts.",
      googleNudgeDismiss: "Not now",
      aha: {
        snapTooltip:
          "Tap here to snap a photo and see your tax saved instantly.",
        sandboxShutterAria: "Take sample receipt photo",
        sandboxTooltip:
          "Tap the shutter to snap your sample receipt.",
        snackbar: "You just saved $28.50!",
        signup: {
          title: "Secure your tax assets",
          body: "You just saved your first $28.50! Create your secure local vault now to lock and backup your tax assets permanently.",
          later: "Later",
        },
      },
    },
    home: {
      taxHeader: {
        title: "Estimated Tax Saved",
        receiptSingular: "receipt",
        receiptPlural: "receipts",
        tracked: "tracked",
        exportTaxPack: "Export tax pack",
        installApp: "Install app",
        syncReceipts: "Sync receipts",
        settings: "Settings",
        filterReceipts: "Filter receipts",
      },
      snapButton: {
        title: "Snap Receipt",
        resnapSubtitle: "Resnap this receipt",
        subtitle: "Take a photo of your receipt",
      },
      receiptList: {
        filters: {
          all: "ALL",
          done: "READY",
          processing: "PROCESSING",
          blurry: "BLURRY",
          stuckAria: "Stuck receipts",
        },
        title: "All Local Receipts",
        refresh: "Pull to refresh",
        emptyFirst: "Snap your first receipt to get started",
        emptyFilter: "No receipts in this filter",
        uploadPaused: "UPLOAD PAUSED",
        analysisPaused: "ANALYSIS PAUSED",
        photoMissingTitle: "PHOTO MISSING",
        photoMissingSubtitle: "Tap to resnap",
        uploading: "UPLOADING...",
        tapToRetry: "Tap to retry",
        processing: "Processing",
        receiptBlurry: "Receipt Blurry",
        needAction: "Need Action",
        resnap: "Resnap",
        unknownMerchant: "Unknown merchant",
        duplicateReceipt: "This receipt is already in your list.",
        status: {
          analyzing: "ANALYZING",
          uploading: "UPLOADING",
          paused: "PAUSED",
        },
      },
      trustBar: {
        message:
          "Your receipts stay private. Never shared with IRS. Stored securely in the U.S.",
        learnMore: "Learn more",
      },
      widgets: {
        deadline: {
          label: "Next Tax Deadline",
          dueInDays: "Due in {days} Days",
          projectedPayment: "Projected Payment: {amount}",
          viewDetails: "View Details",
        },
        missing: {
          label: "You May Be Missing",
          amountInDeductions: "{amount} in deductions",
          review: "Review",
        },
        progress: {
          label: "{year} Tax Year",
          percentComplete: "{pct}% of this tax year completed",
          projectedSavings: "Projected Savings: {amount}",
        },
        cpa: {
          label: "CPA Ready",
          receiptsOrganized: "{count} receipts organized",
          export: "Export",
          subcopy: "Excel tax pack",
        },
      },
      overlays: {
        back: "< BACK",
        gotIt: "Got it",
        privacyTitle: "Your Privacy & Security",
        privacyPoints: [
          {
            title: "100% Private",
            body: "Only you can see your receipts. Never shared with the IRS or anyone else.",
          },
          {
            title: "Secure in the U.S.",
            body: "Your data is encrypted and stored in secure U.S. data centers.",
          },
          {
            title: "We Don't Sell Data",
            body: "No ads. No tracking. We never sell your information.",
          },
          {
            title: "You're in Control",
            body: "Delete your data anytime from Settings.",
          },
        ],
        deadlineTitle: "Deadline Details",
        daysLeft: "{days} Days Left",
        income: "Income",
        expenses: "Expenses",
        netProfit: "Net Profit",
        missingTitle: "Potential Deductions",
        startTracking: "Start Tracking",
      },
    },
    receiptDetail: {
      close: "Close",
      uploadPaused: "Upload paused",
      analysisPaused: "Analysis paused",
      calculating: "Calculating your deductions...",
      mayTakeSeconds: "This may take a few seconds.",
      dateCapturedLong: "📅 Date Captured: {date}",
      retryUpload: "Retry upload",
      retryAnalysis: "Retry analysis",
      blurryTitle: "⚠️ Tax AI Couldn't Read This",
      blurryBody: "The image is too blurry or shaky.",
      partialDetails: "Partial Details",
      possibleMerchant: "Possible Merchant: {merchant}",
      dateCaptured: "Date Captured: {date}",
      merchant: "Merchant",
      totalAmount: "Total Amount",
      category: "Category",
      irsLine: "IRS Line",
      blurryPreview: "Blurry Preview",
      originalCapture: "Original Receipt Capture",
      tapToEnlarge: "Tap to enlarge",
      tapToZoom: "Tap to zoom",
      encryptionNote:
        "🛡 Photos are encrypted on this device until uploaded. After upload, your receipt is stored securely on our servers.",
      thumbnailAlt: "Receipt thumbnail",
      photoOffline: "Photo available when you're back online",
      photoMissing: "Photo not on this device",
      loadingPhoto: "Loading photo…",
      delete: "Delete",
      deleteReceipt: "Delete receipt",
      resnap: "Resnap",
      resnapReceipt: "Resnap receipt",
      deleteConfirmTitle: "Delete this receipt?",
      deleteConfirmBody: "This removes it from your deductions.",
      cancel: "Cancel",
      stepperAria: "Processing progress",
      stepperPhoto: "Photo",
      stepperAnalyzing: "Analyzing",
      stepperCalculating: "Calculating",
      zoomAria: "Receipt photo zoom",
      zoomOut: "Zoom out",
      zoomIn: "Zoom in",
      resetZoom: "Reset zoom (1:1)",
      receiptAlt: "Receipt",
      partialMerchantUnknown: "Unknown (Unclear)",
      partialMerchantUnclear: "{merchant} (Unclear)",
      hero: {
        personalEu: "Personal expense — no VAT recovery",
        personalUs: "Personal (Non-Deductible)",
        addedVat: "✓ Added to VAT recovery",
        addedScheduleC: "✓ Added to Schedule C Deduction",
      },
    },
    paywall: {
      oneTimeSeason: "One-Time for {season} Tax Season",
      description:
        "Export an IRS-ready Excel file — send to your CPA or import into TurboTax. Saves hours of manual entry.",
      backupWarning:
        "Sign in with Google before switching phones, or local data will be lost.",
      openingPaddle: "Opening Paddle…",
      payButton: "Pay $49 with Paddle",
      paymentUnavailable: "Payment unavailable. Paddle is not configured.",
      paymentFailed: "Payment failed. Please try again.",
      confirmingPayment: "Confirming payment…",
      confirmingPaymentHint:
        "Your payment was received. We are unlocking your tax season export.",
      openingExport: "Opening export…",
      back: "< BACK",
    },
    auth: {
      googleSignIn: {
        soft: {
          title: "Save your receipts",
          body: "Sign in with Google to back up your receipts and tax data. Required before switching phones.",
        },
        hardExport: {
          title: "Sign in to export",
          body: "Exporting your tax pack requires identity verification. Please sign in with Google.",
        },
        hardSync: {
          title: "View on all devices",
          body: "To sync across phone, tablet, or computer, sign in with Google.",
        },
        signingIn: "Signing in…",
        preparingGoogle: "Loading Google sign-in…",
        continueWithGoogle: "Continue with Google",
        notNow: "Not now",
        back: "< BACK",
        signInFailed: "Sign-in failed. Please try again.",
        signInUnauthorized:
          "Session expired. Refresh the page and try again.",
        signInGhostBound:
          "This device is already linked to another Google account.",
        signInServerError: "Service temporarily unavailable. Try again soon.",
        signInConfig: "Google sign-in is not configured on this build.",
        ghostRegisterFailed:
          "Could not start your device session. Check your connection.",
        syncAfterSignInFailed:
          "Signed in, but sync is still catching up. Your receipts are safe on this device.",
        onboardingSignup: {
          title: "Secure your tax assets",
          body: "You just saved your first $28.50! Create your secure local vault now to lock and backup your tax assets permanently.",
          later: "Later",
        },
      },
      syncInstructions: {
        title: "View on all devices",
        steps: [
          "1. Open Snap1099 on your other phone, tablet, or computer.",
          "2. Tap Settings and choose Continue with Google.",
          "3. Sign in with the same Google account — receipts sync automatically.",
        ],
        gotIt: "Got it",
      },
    },
    legal: {
      compliance: {
        prefix: "By snapping, you agree to our ",
        terms: "Terms",
        middle: " & ",
        privacy: "Privacy Policy",
        suffix: ". Online processing stores data in the United States.",
      },
    },
    settings: {
      back: "< BACK",
      title: "Settings",
      account: {
        title: "Account",
        signedInPrefix: "Signed in",
        cloudBackupOn: "Cloud backup on",
        taxSeasonPaid: "Tax Season · Paid ✓",
        notSignedIn: "Not signed in · Data lost if you change phones",
        backupHint:
          "Sign in with Google to back up receipts before switching phones.",
        googleCta: "Continue with Google",
        signOut: "Sign out",
        signOutTitle: "Sign out?",
        signOutWarning:
          "Your receipts stay backed up in the cloud. Local copies remain on this device.",
        signOutRequiresOnline: "Connect to the internet to sign out.",
        signOutFailed: "Could not sign out. Try again.",
        signingOut: "Signing out…",
      },
      language: {
        title: "Language",
        english: "English",
        french: "Français",
        german: "Deutsch",
      },
      industry: {
        title: "Your Industry",
        labels: {
          truck_driver: "Truck Driver",
          plumber: "Plumber",
          electrician: "Electrician",
          construction: "Construction",
          delivery: "Delivery",
          general: "General 1099",
        },
      },
      share: {
        title: "Share",
        hint: "Tell a fellow 1099 contractor",
        whatsapp: "WhatsApp",
        facebook: "Facebook",
        more: "More",
        message:
          "I use Snap1099 to snap receipts and export an IRS-ready tax pack. Try it:",
        shareTitle: "Snap1099 — Receipts to IRS tax pack",
        linkCopied: "Link copied",
        shareFailed: "Could not share. Link copied instead.",
      },
      privacyData: {
        title: "Privacy & Data",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        dataStorage: "Data storage",
        dataStorageValue:
          "Processed and stored in the United States. See Privacy Policy for international transfers.",
        contactPrefix: "Contact",
        deleteAccount: "Delete Account",
        deleteFailed: "Delete failed. Please try again.",
        deleteRequiresOnline:
          "Connect to the internet to delete your account and cloud data.",
        deleteTitle: "Delete Account",
        deleteSignedInWarning:
          "This is irreversible. All cloud receipts, export records, and account data will be permanently deleted.",
        deleteGhostWarning:
          "Clears all receipts on this device and cloud Ghost data. Cannot be undone.",
        deleting: "Deleting...",
        deletePermanently: "Delete permanently",
        cancel: "Cancel",
      },
      preferences: {
        title: "Preferences",
      },
      export: {
        title: "Tax Export",
        button: "Export IRS Tax Pack",
        buttonLocked: "Export {season} IRS Tax Pack ($49)",
        buttonPaid: "Export Again",
        exporting: "Exporting…",
        shareText: "Your IRS-ready expense export",
        offline: "You're offline. Connect to export.",
        noReceipts:
          "No completed receipts to export. Snap some receipts first!",
        failed: "Export failed. Please try again.",
        failedAfterPayment: "Export failed after payment. Try Export Again.",
        paymentConfirmed: "Payment confirmed. Tap Export Again to download.",
      },
      help: {
        title: "Help",
        button: "How to Use Snap1099",
        hint: "Quick guides for snapping, saving, and tax export.",
      },
    },
    help: {
      pageTitle: "Help",
      backToApp: "< BACK",
      backToTopics: "< BACK",
      allTopics: "All topics",
      contact: "Need more help? legal@snap1099.com",
      tocTitle: "Topics",
      toc: {
        quickStart: "Quick start (30 sec)",
        snapReceipt: "Snap a receipt",
        homeScreen: "Home screen",
        googleBackup: "Save with Google",
        taxExport: "Tax season export",
        faq: "Common questions",
        privacy: "Your data",
      },
      sections: {
        quickStart: {
          title: "Get started in 30 seconds",
          steps: [
            "Open Snap1099. **No sign-up needed.**",
            "Tap the big yellow **SNAP RECEIPT** button.",
            "Point your camera at the receipt. Tap shutter. **Done — go back to work.**",
            "When you have signal, the app reads the receipt and shows the amount.",
            "Watch **Est. Tax Saved** at the top go up.",
          ],
          closing:
            "That's it. Sign in with **Continue with Google** later to back up before you get a new phone.",
        },
        snapReceipt: {
          title: "How to snap a receipt",
          stepsTitle: "Steps",
          steps: [
            "Tap **SNAP RECEIPT** (big yellow button).",
            "Your phone camera opens full screen.",
            "Hold the receipt flat. Tap the shutter.",
            "You're back on the home screen right away. **No need to check if it's clear.**",
          ],
          tipsTitle: "Tips",
          tips: [
            "**Good light** helps. Avoid glare.",
            "One receipt per photo works best.",
            "**Batch mode:** keep shooting — tap **DONE & REVIEW** when finished.",
          ],
          blurryTitle: "Blurry photo",
          blurry:
            "The list shows **Receipt blurry. Tap to resnap** in red. Tap that row to take a new photo.",
          offlineTitle: "No internet?",
          offline:
            "You can still snap. The receipt saves on your phone with **Processing...** and **Uploading**. When signal comes back, it uploads automatically.",
        },
        homeScreen: {
          title: "What you see on the home screen",
          rows: [
            {
              label: "**Est. Tax Saved** (yellow, top)",
              meaning:
                "Rough guess of tax you might save. **Not official tax advice.**",
            },
            {
              label: "**SNAP RECEIPT**",
              meaning: "Take a photo of a receipt.",
            },
            {
              label: "**Processing...** + **Uploading**",
              meaning: "Saved. Waiting for internet or AI.",
            },
            {
              label: "**$45.20** + **TRUCK GAS**",
              meaning: "Done. Amount and work category.",
            },
            {
              label: "**Personal (Non-Deductible)**",
              meaning: "Private purchase — won't add to tax saved.",
            },
            {
              label: "Gear icon (top right)",
              meaning: "**Settings** — export, account, industry.",
            },
            {
              label: "**PULL TO REFRESH**",
              meaning: "Pull down the list to sync.",
            },
          ],
          filtersNote:
            "Filter tabs at the bottom: **All** · **Done** · **Processing** · **Blurry**",
        },
        googleBackup: {
          title: "Don't lose your receipts",
          whyTitle: "Why sign in?",
          why: [
            "Backs up receipts to the cloud.",
            "**Required before you switch phones.**",
            "Same data on phone, tablet, or computer.",
          ],
          howTitle: "How",
          how: [
            "Tap the gear → **Settings**.",
            "Tap **Continue with Google**.",
            "Pick your Google account. Done.",
          ],
          staySame:
            "**Your receipts stay the same** — nothing moves or resets.",
          warningTitle: "Important",
          warnings: [
            "**Not signed in + new phone = data gone.** We can't get it back.",
            "Sign in **before** you trade in or lose your phone.",
          ],
          multiDeviceTitle: "View on all devices",
          multiDevice:
            "**Settings** → **View on All Devices**. Sign in with the **same Google account** on each device.",
        },
        taxExport: {
          title: "Export for tax time",
          when:
            "Snap all year — **pay only when you export.** Usually January–April (US tax season).",
          whatTitle: "What you get",
          what: [
            "**CSV for TurboTax** — import into TurboTax or other tax software.",
            "**CPA Audit Pack** — ZIP with spreadsheet + receipt photos for your accountant.",
          ],
          stepsTitle: "Steps",
          steps: [
            "**Settings** → **Export IRS Tax Pack**",
            "Sign in with Google (if not yet).",
            "Pay **$49** once for this tax season (via Paddle).",
            "Pick your tax year and file type.",
            "Share the file — email, WhatsApp, or save to Files.",
          ],
          afterPayTitle: "After you pay",
          afterPay: [
            "**Export Again** as many times as you want **this season**.",
            "New receipts you snap later are included.",
            "Next tax season = new **$49**.",
          ],
          beforePay:
            "Read the yellow warning before you pay: **Sign in with Google before switching phones.**",
        },
        faq: {
          title: "Common questions",
          items: [
            {
              q: "Do I need an account to snap receipts?",
              a: "No. Snap first. Sign in later to back up.",
            },
            {
              q: "Is snapping free?",
              a: "Yes. You only pay **$49** when you export for tax season.",
            },
            {
              q: "I snapped with no signal. Is my receipt safe?",
              a: "Yes. It's on your phone. It uploads when you're online.",
            },
            {
              q: 'Why is it still "Processing..."?',
              a: "Waiting for internet or the server. Pull to refresh. Tap the row to retry if stuck.",
            },
            {
              q: "I snapped my lunch by mistake.",
              a: "AI may mark it **Personal (Non-Deductible)**. It won't count toward tax saved.",
            },
            {
              q: 'What is "Est. Tax Saved"?',
              a: "A rough estimate. **Not** what the IRS owes you. Talk to a CPA for real numbers.",
            },
            {
              q: "I got a new phone. Where are my receipts?",
              a: "Open Snap1099 → **Continue with Google** with the **same account**. They sync back.",
            },
            {
              q: "I never signed in and got a new phone.",
              a: "Sorry — those receipts can't be recovered.",
            },
            {
              q: "Payment worked but export didn't start.",
              a: "Wait a few seconds. Try **Export Again**. Check internet.",
            },
            {
              q: "How do I delete everything?",
              a: "**Settings** → **Privacy & Data** → **Delete Account**.",
            },
          ],
        },
        privacy: {
          title: "Your data",
          paragraphs: [
            "Receipt photos are stored securely in the **United States** when you're online.",
            "We use AI to read receipts. We **don't sell** your data. No ads.",
          ],
          privacyLink: "Privacy Policy",
          termsLink: "Terms of Service",
        },
      },
    },
    exportEngine: {
      title: "Export Tax Pack",
      close: "Close",
      stepLabel: "Step {step} of {total}",
      step1Heading: "Select tax year",
      step2Heading: "Review categories",
      stepFormatHeading: "Choose export format",
      step3Heading: "Your tax pack",
      yearCard: "{year} Tax Year",
      yearRange: "Jan 1 – Dec 31, {year}",
      deductionsLabel: "Est. Tax Deductions: {amount}",
      receiptsLabel: "{count} Receipts Captured",
      noReceiptsYear: "No receipts for this year",
      noDeductibleReceipts:
        "No tax-deductible receipts yet. Snap some business receipts first!",
      continue: "Continue →",
      back: "← Back",
      generate: "Generate →",
      generating: "Building your pack…",
      ready: "Ready to share",
      share: "Share Tax Pack →",
      yearSummary: "{year} · {amount} · {count} receipts",
      formatCsvTitle: "CSV for TurboTax / Tax Software",
      formatCsvHint:
        "Optimized matrix format for instant tax software uploading.",
      formatCpaTitle: "CPA Audit Pack (ZIP + Receipt Images)",
      formatCpaHint:
        "IRS-compliant audit trail with your original receipt photos.",
      sharing: "Opening share sheet…",
      imagesComplete: "{included} of {eligible} receipt images included",
      imagesMissing: "{missing} receipt images could not be included",
      sharingHint: "Tap Share again if you dismissed the sheet",
      reviewHint:
        "These receipts need a category before your CPA or tax software can use them.",
      reviewUnknownMerchant: "Unknown merchant",
      reviewSaving: "Saving…",
      reviewSaveFailed: "Could not save category. Try again.",
      formatCpaPdfTitle: "CPA Summary PDF (Links to Receipts)",
      formatCpaPdfHint:
        "IRS-compliant summary with clickable links to your receipt photos.",
      turboTaxSteps: [
        "Open TurboTax Self-Employed → Business",
        "Choose Import / Upload expenses from CSV",
        "Select this Snap1099 CSV file",
        "Map columns if prompted (Date, Amount, Category)",
      ],
      previewCsv: "Preview CSV locally",
      previewCsvHint:
        "Instant offline preview without receipt image links. Full export adds signed URLs.",
      progressPreparing: "Preparing expenses…",
      progressFetchingImages: "Fetching receipt images…",
      progressFinalizing: "Finalizing your pack…",
    },
  };
