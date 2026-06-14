import type { Industry } from "@/lib/types";

export type UserCopy = {
  app: {
    description: string;
  };
  pwa: {
    title: string;
    subtitle: string;
    install: string;
    howToInstall: string;
    dismiss: string;
    dismissInstallAria: string;
    manualHint: string;
    manualSheetTitle: string;
    manualSheetLead: string;
    manualGotIt: string;
    manualSteps: {
      chromiumAndroid: string[];
      chromiumDesktop: string[];
      iosSafari: string[];
      macosSafari: string[];
    };
  };
  camera: {
    opening: string;
    openFailed: string;
    captureFailed: string;
    retry: string;
    chooseGallery: string;
    takePhoto: string;
    takePhotoAria: string;
    flashDoneLine1: string;
    flashDoneLine2: string;
    flashDoneAria: string;
    doneReviewLine1: string;
    doneReviewLine2: string;
    doneReviewAria: string;
    batchReviewAria: string;
    batchLabel: string;
    review: {
      delete: string;
      deleteReceipt: string;
      deleteFromBatch: string;
      resnap: string;
      resnapReceipt: string;
      done: string;
      acceptReceipt: string;
    };
    gallery: {
      latest: string;
      selected: string;
      accepted: string;
      default: string;
    };
    errors: {
      notAllowed: string;
      notFound: string;
      notReadable: string;
      abort: string;
      default: string;
    };
  };
  offline: {
    label: string;
    title: string;
    body: string;
    backHome: string;
  };
  onboarding: {
    landing: {
      headline: string;
      tagline: string;
      step1: string;
      step2: string;
      step3: string;
      cta: string;
      ctaAria: string;
      ariaStatus: string;
    };
    snapCoach: string;
    dismissCoach: string;
    firstReceipt: {
      processing: string;
      done: string;
      blurry: string;
    };
    googleNudge: string;
    googleNudgeDismiss: string;
    aha: {
      snapTooltip: string;
      sandboxShutterAria: string;
      snackbar: string;
      signup: {
        title: string;
        body: string;
        later: string;
      };
    };
  };
  home: {
    taxHeader: {
      title: string;
      receiptSingular: string;
      receiptPlural: string;
      tracked: string;
      exportTaxPack: string;
      installApp: string;
      syncReceipts: string;
      settings: string;
    };
    snapButton: {
      title: string;
      resnapSubtitle: string;
      subtitle: string;
    };
    receiptList: {
      filters: {
        all: string;
        done: string;
        processing: string;
        blurry: string;
        stuckAria: string;
      };
      title: string;
      refresh: string;
      emptyFirst: string;
      emptyFilter: string;
      uploadPaused: string;
      analysisPaused: string;
      uploading: string;
      tapToRetry: string;
      processing: string;
      receiptBlurry: string;
      needAction: string;
      resnap: string;
      unknownMerchant: string;
      status: {
        analyzing: string;
        uploading: string;
        paused: string;
      };
    };
  };
  receiptDetail: {
    close: string;
    uploadPaused: string;
    analysisPaused: string;
    calculating: string;
    mayTakeSeconds: string;
    dateCapturedLong: string;
    retryUpload: string;
    retryAnalysis: string;
    blurryTitle: string;
    blurryBody: string;
    partialDetails: string;
    possibleMerchant: string;
    dateCaptured: string;
    merchant: string;
    totalAmount: string;
    category: string;
    irsLine: string;
    blurryPreview: string;
    originalCapture: string;
    tapToEnlarge: string;
    tapToZoom: string;
    encryptionNote: string;
    thumbnailAlt: string;
    photoOffline: string;
    photoMissing: string;
    loadingPhoto: string;
    delete: string;
    deleteReceipt: string;
    resnap: string;
    resnapReceipt: string;
    deleteConfirmTitle: string;
    deleteConfirmBody: string;
    cancel: string;
    stepperAria: string;
    stepperPhoto: string;
    stepperAnalyzing: string;
    stepperCalculating: string;
    zoomAria: string;
    zoomOut: string;
    zoomIn: string;
    resetZoom: string;
    receiptAlt: string;
    partialMerchantUnknown: string;
    partialMerchantUnclear: string;
    hero: {
      personalEu: string;
      personalUs: string;
      addedVat: string;
      addedScheduleC: string;
    };
  };
  paywall: {
    oneTimeSeason: string;
    description: string;
    backupWarning: string;
    openingPaddle: string;
    payButton: string;
    paymentUnavailable: string;
    paymentFailed: string;
    back: string;
  };
  auth: {
    googleSignIn: {
      soft: { title: string; body: string };
      hardExport: { title: string; body: string };
      hardSync: { title: string; body: string };
      signingIn: string;
      continueWithGoogle: string;
      notNow: string;
      back: string;
      signInFailed: string;
      onboardingSignup: {
        title: string;
        body: string;
        later: string;
      };
    };
    syncInstructions: {
      title: string;
      steps: string[];
      gotIt: string;
    };
  };
  legal: {
    compliance: {
      prefix: string;
      terms: string;
      middle: string;
      privacy: string;
      suffix: string;
    };
  };
  settings: {
    back: string;
    title: string;
    account: {
      title: string;
      signedInPrefix: string;
      cloudBackupOn: string;
      taxSeasonPaid: string;
      notSignedIn: string;
      backupHint: string;
      googleCta: string;
    };
    language: {
      title: string;
      english: string;
      french: string;
      german: string;
    };
    industry: {
      title: string;
      labels: Record<Industry, string>;
    };
    multiDevice: {
      title: string;
      button: string;
    };
    privacyData: {
      title: string;
      privacy: string;
      terms: string;
      dataStorage: string;
      dataStorageValue: string;
      contactPrefix: string;
      deleteAccount: string;
      deleteFailed: string;
      deleteTitle: string;
      deleteSignedInWarning: string;
      deleteGhostWarning: string;
      deleting: string;
      deletePermanently: string;
      cancel: string;
    };
    export: {
      title: string;
      button: string;
      buttonPaid: string;
      exporting: string;
      shareText: string;
      offline: string;
      noReceipts: string;
      failed: string;
      failedAfterPayment: string;
      paymentConfirmed: string;
    };
    help: {
      title: string;
      button: string;
      hint: string;
    };
  };
  help: {
    pageTitle: string;
    backToApp: string;
    backToTopics: string;
    allTopics: string;
    contact: string;
    tocTitle: string;
    toc: {
      quickStart: string;
      snapReceipt: string;
      homeScreen: string;
      googleBackup: string;
      taxExport: string;
      faq: string;
      privacy: string;
    };
    sections: {
      quickStart: {
        title: string;
        steps: string[];
        closing: string;
      };
      snapReceipt: {
        title: string;
        stepsTitle: string;
        steps: string[];
        tipsTitle: string;
        tips: string[];
        blurryTitle: string;
        blurry: string;
        offlineTitle: string;
        offline: string;
      };
      homeScreen: {
        title: string;
        rows: { label: string; meaning: string }[];
        filtersNote: string;
      };
      googleBackup: {
        title: string;
        whyTitle: string;
        why: string[];
        howTitle: string;
        how: string[];
        staySame: string;
        warningTitle: string;
        warnings: string[];
        multiDeviceTitle: string;
        multiDevice: string;
      };
      taxExport: {
        title: string;
        when: string;
        whatTitle: string;
        what: string[];
        stepsTitle: string;
        steps: string[];
        afterPayTitle: string;
        afterPay: string[];
        beforePay: string;
      };
      faq: {
        title: string;
        items: { q: string; a: string }[];
      };
      privacy: {
        title: string;
        paragraphs: string[];
        privacyLink: string;
        termsLink: string;
      };
    };
  };
  exportEngine: {
    title: string;
    close: string;
    stepLabel: string;
    step1Heading: string;
    step2Heading: string;
    stepFormatHeading: string;
    step3Heading: string;
    yearCard: string;
    yearRange: string;
    deductionsLabel: string;
    receiptsLabel: string;
    noReceiptsYear: string;
    continue: string;
    back: string;
    generate: string;
    generating: string;
    ready: string;
    share: string;
    yearSummary: string;
    formatCsvTitle: string;
    formatCsvHint: string;
    formatCpaTitle: string;
    formatCpaHint: string;
    sharing: string;
    imagesComplete: string;
    imagesMissing: string;
    sharingHint: string;
    reviewHint: string;
    reviewUnknownMerchant: string;
    reviewSaving: string;
    reviewSaveFailed: string;
    formatCpaPdfTitle: string;
    formatCpaPdfHint: string;
    turboTaxSteps: string[];
    previewCsv: string;
    previewCsvHint: string;
    progressPreparing: string;
    progressFetchingImages: string;
    progressFinalizing: string;
  };
};
