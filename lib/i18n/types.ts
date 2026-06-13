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
  };
  home: {
    taxHeader: {
      title: string;
      receiptSingular: string;
      receiptPlural: string;
      tracked: string;
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
