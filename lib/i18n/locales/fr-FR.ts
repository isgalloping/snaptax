import type { UserCopy } from "../types";

export const FR_FR_COPY: UserCopy = {
  app: {
    description:
      "Photographiez vos reçus, catégorisation automatique. Comptabilité 1099 simplifiée.",
  },
  pwa: {
    title: "Ajouter Snap1099 à l'écran d'accueil",
    subtitle:
      "Ouvrez comme une app native — photographiez vos reçus d'une main sur le chantier",
    install: "Installer",
    howToInstall: "Comment ajouter",
    dismiss: "Pas maintenant",
    dismissInstallAria: "Fermer les instructions d'installation",
    manualHint: "Appuyez sur ⋮ dans Chrome, puis Installer l'application",
    manualSheetTitle: "Installer Snap1099",
    manualSheetLead:
      "Votre navigateur ne peut pas installer automatiquement — suivez ces étapes :",
    manualGotIt: "Compris",
    installWebApkLead:
      "Utilisez Installer l'application — pas un raccourci favori. Snap1099 s'ouvre en plein écran depuis l'écran d'accueil.",
    launchFromHomeHint:
      "Ouvrez Snap1099 depuis l'icône de l'écran d'accueil, pas dans Chrome.",
    launchFromHomeGotIt: "Compris",
    webApkGuide: {
      preInstallTitle: "Avant l'installation",
      preInstallBody:
        "Après l'installation, ouvrez Snap1099 depuis l'écran d'accueil — pas dans Chrome. Sur certains téléphones Android, le premier lancement demande d'ouvrir Chrome. Appuyez sur Toujours autoriser. Refuser empêchera l'application de s'ouvrir.",
      continueInstall: "Continuer l'installation",
      postInstallTitle: "Snap1099 installé",
      postInstallSteps: [
        "Allez sur l'écran d'accueil et appuyez sur l'icône Snap1099.",
        "Si votre téléphone demande d'ouvrir Chrome, appuyez sur Toujours autoriser.",
        "L'application s'ouvre en plein écran sans barre d'adresse.",
      ],
      gotIt: "Compris",
    },
    manualSteps: {
      chromiumAndroid: [
        "Appuyez sur ⋮ (en haut à droite de Chrome), puis sur « Installer l'application » (pas un raccourci).",
        "Confirmez — Snap1099 s'ouvre depuis votre écran d'accueil comme une app native.",
        "Au premier lancement depuis l'écran d'accueil, si on vous demande d'ouvrir Chrome, appuyez sur Toujours autoriser. Refuser bloque l'ouverture de l'app.",
      ],
      chromiumDesktop: [
        "Appuyez sur le menu ⋮ (en haut à droite de Chrome ou Edge).",
        'Appuyez sur « Applications » → « Installer Snap1099 » (ou « Installer ce site »).',
        "Confirmez — Snap1099 s'ouvre dans sa propre fenêtre.",
      ],
      iosSafari: [
        "Appuyez sur le bouton Partager (carré avec flèche) en bas de Safari.",
        'Faites défiler et appuyez sur « Sur l\'écran d\'accueil ».',
        'Appuyez sur « Ajouter » — ouvrez Snap1099 depuis votre écran d\'accueil.',
      ],
      macosSafari: [
        "Appuyez sur le bouton Partager dans la barre d'outils de Safari.",
        'Choisissez « Ajouter au Dock ».',
        "Snap1099 apparaît dans votre Dock comme une app native.",
      ],
    },
  },
  camera: {
    opening: "Ouverture de l'appareil photo…",
    openFailed: "Impossible d'ouvrir l'appareil photo. Réessayez.",
    captureFailed: "Échec de la capture. Réessayez.",
    retry: "Réessayer",
    chooseGallery: "Choisir dans la galerie",
    takePhoto: "Prendre une photo",
    takePhotoAria: "Prendre une photo",
    flashDoneLine1: "Flash",
    flashDoneLine2: "Terminé",
    flashDoneAria: "Flash terminé",
    doneReviewLine1: "Terminé",
    doneReviewLine2: "et réviser",
    doneReviewAria: "Terminé et réviser",
    batchReviewAria: "Réviser le dernier lot",
    batchLabel: "Lot {count}",
    review: {
      delete: "Supprimer",
      deleteReceipt: "Supprimer le reçu",
      deleteFromBatch: "Supprimer le reçu du lot",
      resnap: "Reprendre",
      resnapReceipt: "Reprendre le reçu",
      done: "Terminé",
      acceptReceipt: "Accepter le reçu",
    },
    gallery: {
      latest: "Dernière photo de reçu",
      selected: "Photo de reçu sélectionnée",
      accepted: "Photo de reçu acceptée",
      default: "Photo de reçu",
    },
    errors: {
      notAllowed:
        "L'accès à l'appareil photo est requis pour photographier les reçus. Autorisez l'appareil photo dans les paramètres de votre navigateur.",
      notFound: "Aucun appareil photo trouvé",
      notReadable: "L'appareil photo est utilisé par une autre application",
      abort: "Impossible d'ouvrir l'appareil photo. Réessayez.",
      default: "Impossible d'ouvrir l'appareil photo. Réessayez.",
    },
  },
  offline: {
    label: "HORS LIGNE",
    title: "Vous êtes hors ligne",
    body: "Vous pouvez toujours photographier des reçus. Ils seront envoyés lorsque vous serez de nouveau en ligne.",
    backHome: "Retour à l'accueil",
  },
  onboarding: {
    landing: {
      headlineLead: "Gardez plus de votre",
      headlineAccent: "argent durement gagné.",
      tagline: "L'IA trouve des déductions fiscales que d'autres manquent.",
      check1: "Fonctionne hors ligne",
      check2: "10 reçus en 10 sec",
      check3: "Pas d'inscription requise",
      cta: "C'est parti ! ⚡",
      ctaCountdown: "C'est parti ! ({seconds})",
      ctaAria: "Commencer l'introduction",
      ariaStatus: "Chargement de Snap1099",
    },
    snapCoach:
      "Appuyez sur SNAP RECEIPT — photographiez tout reçu professionnel.",
    dismissCoach: "Fermer l'indication",
    skip: "Passer",
    skipAria: "Passer le tutoriel d'introduction",
    firstReceipt: {
      processing:
        "Lecture de votre reçu… Photographiez-en d'autres à tout moment.",
      done: "Ajouté ! L'estimation d'économies fiscales se met à jour en haut.",
      blurry: "Trop flou — appuyez sur la ligne pour reprendre la photo.",
    },
    googleNudge:
      "Nouveau téléphone ? Connectez-vous avec Google pour sauvegarder vos reçus.",
    googleNudgeDismiss: "Pas maintenant",
    aha: {
      snapTooltip:
        "Appuyez ici pour prendre une photo et voir vos économies fiscales instantanément.",
      sandboxShutterAria: "Prendre une photo d'exemple de reçu",
      sandboxTooltip:
        "Appuyez sur l'obturateur pour photographier votre reçu d'exemple.",
      snackbar: "Vous venez d'économiser 28,50 $ !",
      signup: {
        title: "Sécurisez vos économies fiscales",
        body: "Vous venez d'économiser vos premiers 28,50 $ ! Créez votre coffre-fort local sécurisé pour verrouiller et sauvegarder vos économies fiscales de façon permanente.",
        later: "Plus tard",
      },
    },
  },
  home: {
    taxHeader: {
      title: "Économies fiscales estimées",
      receiptSingular: "reçu",
      receiptPlural: "reçus",
      tracked: "enregistrés",
      exportTaxPack: "Exporter le dossier fiscal",
      cpaIrsReady: "CPA /IRS Ready",
      installApp: "Ajouter Snap1099 à l'écran d'accueil",
      installShortLabel: "ACCUEIL",
      syncReceipts: "Synchroniser les reçus",
      settings: "Paramètres",
      filterReceipts: "Filter receipts",
    },
    snapButton: {
      title: "Photographier un reçu",
      resnapSubtitle: "Reprendre ce reçu",
      subtitle: "Prenez une photo de votre reçu",
    },
    receiptList: {
      filters: {
        all: "TOUS",
        ready: "PRÊTS",
        review: "À VÉRIFIER",
        action: "ACTION",
        processing: "EN COURS",
      },
      recentReceipts: "Reçus récents",
      pullToRefresh: "Tirez pour actualiser",
      emptyFirst: "Photographiez votre premier reçu pour commencer",
      emptyFilter: "Aucun reçu dans ce filtre",
      uploadPaused: "ENVOI EN PAUSE",
      analysisPaused: "ANALYSE EN PAUSE",
      photoMissingTitle: "PHOTO MANQUANTE",
      photoMissingSubtitle: "Appuyez pour reprendre",
      uploading: "ENVOI EN COURS...",
      tapToRetry: "Appuyez pour réessayer",
      processing: "En cours de traitement",
      receiptBlurry: "Reçu flou",
      needAction: "Action requise",
      resnap: "Reprendre",
      delete: "Supprimer",
      unknownMerchant: "Commerçant inconnu",
      duplicateReceipt: "Ce reçu est déjà dans votre liste.",
      duplicateReceiptSimilar:
        "Ce reçu ressemble à un reçu que vous avez déjà scanné.",
      status: {
        analyzing: "ANALYSE",
        uploading: "ENVOI",
        paused: "EN PAUSE",
      },
    },
    trustBar: {
      message: "L'IRS ne voit jamais vos reçus.",
      learnMore: "En savoir plus",
    },
    exitConfirm: {
      title: "Quitter Snap1099 ?",
      body: "Vos reçus restent enregistrés sur cet appareil.",
      stay: "Rester",
      exit: "Quitter",
    },
    widgets: {
      deadline: {
        label: "Prochaine échéance",
        dueInDays: "Dans {days} jours",
        daysShort: "{days} jours",
        projectedPayment: "Paiement estimé : {amount}",
        viewDetails: "Détails",
      },
      missing: {
        label: "Trouver plus d'économies",
        amountInDeductions: "{amount} de déductions",
        amountShort: "{amount} de déductions",
        review: "Examiner",
      },
      progress: {
        label: "Année fiscale {year}",
        percentComplete: "{pct} % de l'année fiscale écoulée",
        percentShort: "{pct} % terminé",
        projectedSavings: "Économies projetées : {amount}",
      },
      cpa: {
        label: "CPA /IRS Ready",
        receiptsOrganized: "{count} receipts organized",
        export: "Export",
        subcopy: "Excel tax pack",
      },
      needAction: {
        label: "Need Action",
        actionCount: "{count} reçu(s) à traiter",
        resnap: "RESNAP NOW",
      },
      founder: {
        label: "FIRST 50 ONLY",
        subtitle: "{price} export this season",
        subtitleLoading: "This season · first 50 only",
        scarcity: "{remaining} spots left",
        view: "See deal",
        newBadge: "NEW",
      },
    },
    founderSheet: {
      title: "First 50 Deal",
      seatsRemaining: "{remaining} of {total} founder seats left",
      becomeFounder: "Claim my spot — {price}",
      signInFirst: "Sign in with Google to claim your spot",
      notNow: "Not now",
      seasonPrice: "{price} for this tax season",
      offerEnds: "Offer ends when {total} spots are gone",
      programFull: "All {total} founder spots are taken",
      alreadyEntitled:
        "You already have Export access for this tax season — no extra charge.",
      paymentUnavailable: "Payment unavailable. Paddle is not configured.",
      paymentFailed: "Payment failed. Please try again.",
      confirmingPayment: "Confirming payment…",
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
      deadlineTitle: "Détails de l'échéance",
      daysLeft: "{days} jours restants",
      income: "Revenus",
      expenses: "Dépenses",
      netProfit: "Bénéfice net",
      taxYearTitle: "Année fiscale {year}",
      yearComplete: "Terminé",
      percentOfYear: "{pct} % de l'année fiscale écoulée",
      daysElapsed: "Jours écoulés",
      daysElapsedValue: "{elapsed} sur {total}",
      projectedSavingsLabel: "Économies projetées",
      missingTitle: "Déductions potentielles",
      startTracking: "Start Tracking",
    },
  },
  receiptDetail: {
    close: "Fermer",
    uploadPaused: "Envoi en pause",
    analysisPaused: "Analyse en pause",
    calculating: "Calcul de vos déductions...",
    mayTakeSeconds: "Cela peut prendre quelques secondes.",
    dateCapturedLong: "📅 Date de capture : {date}",
    retryUpload: "Réessayer l'envoi",
    retryAnalysis: "Réessayer l'analyse",
    blurryTitle: "⚠️ L'IA fiscale n'a pas pu lire ce reçu",
    blurryBody: "L'image est trop floue ou tremblante.",
    partialDetails: "Détails partiels",
    possibleMerchant: "Commerçant possible : {merchant}",
    dateCaptured: "Date de capture : {date}",
    merchant: "Commerçant",
    payer: "Payeur",
    formType: "Type de formulaire",
    taxYear: "Année fiscale",
    taxYearUnknown: "Flou",
    totalAmount: "Montant total",
    category: "Catégorie",
    irsLine: "Ligne IRS",
    blurryPreview: "Aperçu flou",
    originalCapture: "Capture originale du reçu",
    tapToEnlarge: "Appuyez pour agrandir",
    tapToZoom: "Appuyez pour zoomer",
    encryptionNote:
      "🛡 Les photos sont chiffrées sur cet appareil jusqu'à l'envoi. Après l'envoi, votre reçu est stocké en toute sécurité sur nos serveurs.",
    thumbnailAlt: "Miniature du reçu",
    photoOffline: "Photo disponible lorsque vous serez de nouveau en ligne",
    photoMissing: "Photo absente de cet appareil",
    loadingPhoto: "Chargement de la photo…",
    delete: "Supprimer",
    deleteReceipt: "Supprimer le reçu",
    resnap: "Reprendre",
    resnapReceipt: "Reprendre le reçu",
    deleteConfirmTitle: "Supprimer ce reçu ?",
    deleteConfirmBody: "Cela le retire de vos déductions.",
    cancel: "Annuler",
    stepperAria: "Progression du traitement",
    stepperPhoto: "Photo",
    stepperAnalyzing: "Analyse",
    stepperCalculating: "Calcul",
    zoomAria: "Zoom sur la photo du reçu",
    zoomOut: "Zoom arrière",
    zoomIn: "Zoom avant",
    resetZoom: "Réinitialiser le zoom (1:1)",
    receiptAlt: "Reçu",
    partialMerchantUnknown: "Inconnu (flou)",
    partialMerchantUnclear: "{merchant} (flou)",
    hero: {
      personalEu: "Dépense personnelle — pas de récupération de TVA",
      personalUs: "Personnel (non déductible)",
      addedVat: "✓ Ajouté à la récupération de TVA",
      addedScheduleC: "✓ Ajouté aux déductions Schedule C",
      income1099: "Revenu {form}",
    },
  },
  paywall: {
    unlockTitle: "Unlock Your Full Tax Pack — {price}",
    maybeLater: "Maybe later",
    unlockNow: "Unlock now — {price}",
    features: [
      "Export unlimited receipts",
      "CPA-ready Excel tax pack",
      "All tax categories & reports",
      "Deduction finder insights",
      "Secure & IRS compliant",
    ],
    oneTimeSeason: "Paiement unique pour la saison fiscale {season}",
    description:
      "Exportez un fichier Excel prêt pour l'IRS — envoyez-le à votre CPA ou importez-le dans TurboTax. Économise des heures de saisie manuelle.",
    backupWarning:
      "Connectez-vous avec Google avant de changer de téléphone, sinon les données locales seront perdues.",
    openingPaddle: "Ouverture de Paddle…",
    payButton: "Payer 49 $ avec Paddle",
    paymentUnavailable: "Paiement indisponible. Paddle n'est pas configuré.",
    paymentFailed: "Échec du paiement. Veuillez réessayer.",
    confirmingPayment: "Confirmation du paiement…",
    confirmingPaymentHint:
      "Votre paiement a été reçu. Nous débloquons votre export pour la saison fiscale.",
    openingExport: "Ouverture de l'export…",
    back: "< RETOUR",
  },
  paymentSuccess: {
    export: {
      confirmingTitle: "Paiement réussi",
      confirmingHint: "Confirmation de votre dossier fiscal {season}…",
      readyTitle: "Dossier fiscal {season} débloqué",
      readyHint: "Export illimité pour cette saison fiscale.",
      download: "Télécharger le dossier fiscal",
      notNow: "Plus tard",
      errorTitle: "Confirmation en cours",
      errorHint:
        "Votre paiement a peut-être abouti. Réessayez ou consultez Réglages dans un instant.",
      retry: "Réessayer",
      close: "Fermer",
    },
    founder: {
      confirmingTitle: "Paiement réussi",
      confirmingHint: "Activation de vos avantages Founder…",
      readyTitle: "Vous êtes Super Founder !",
      readyHint: "{season} payé · Super Founder n°{number}",
      readyHintNoNumber: "{season} payé",
      gotIt: "Compris",
      errorTitle: "Confirmation en cours",
      errorHint:
        "Votre achat Founder a peut-être abouti. Réessayez ou consultez Réglages dans un instant.",
      retry: "Réessayer",
      close: "Fermer",
    },
  },
  auth: {
    googleSignIn: {
      soft: {
        title: "Sauvegardez vos reçus",
        body: "Connectez-vous avec Google pour sauvegarder vos reçus et données fiscales. Requis avant de changer de téléphone.",
      },
      hardExport: {
        title: "Connectez-vous pour exporter",
        body: "L'export de votre dossier fiscal nécessite une vérification d'identité. Veuillez vous connecter avec Google.",
      },
      hardSync: {
        title: "Voir sur tous les appareils",
        body: "Pour synchroniser entre téléphone, tablette ou ordinateur, connectez-vous avec Google.",
      },
      signingIn: "Connexion…",
      preparingGoogle: "Chargement de la connexion Google…",
      continueWithGoogle: "Continuer avec Google",
      notNow: "Pas maintenant",
      back: "< RETOUR",
      signInFailed: "Échec de la connexion. Veuillez réessayer.",
      signInUnauthorized:
        "Session expirée. Actualisez la page et réessayez.",
      signInGhostBound:
        "Cet appareil est déjà lié à un autre compte Google.",
      signInServerError:
        "Service temporairement indisponible. Réessayez bientôt.",
      signInConfig:
        "La connexion Google n'est pas configurée sur cette version.",
      ghostRegisterFailed:
        "Impossible de démarrer la session appareil. Vérifiez la connexion.",
      syncAfterSignInFailed:
        "Connecté, mais la synchronisation suit. Vos reçus sont en sécurité sur cet appareil.",
      onboardingSignup: {
        title: "Sécurisez vos économies fiscales",
        body: "Vous venez d'économiser vos premiers 28,50 $ ! Créez votre coffre-fort local sécurisé pour verrouiller et sauvegarder vos économies fiscales de façon permanente.",
        later: "Plus tard",
      },
    },
    syncInstructions: {
      title: "Voir sur tous les appareils",
      steps: [
        "1. Ouvrez Snap1099 sur votre autre téléphone, tablette ou ordinateur.",
        "2. Appuyez sur Paramètres et choisissez Continuer avec Google.",
        "3. Connectez-vous avec le même compte Google — les reçus se synchronisent automatiquement.",
      ],
      gotIt: "Compris",
    },
  },
  legal: {
    compliance: {
      prefix: "En photographiant, vous acceptez nos ",
      terms: "Conditions",
      middle: " et notre ",
      privacy: "Politique de confidentialité",
      suffix:
        ". Le traitement en ligne stocke les données aux États-Unis.",
    },
  },
  settings: {
    back: "< RETOUR",
    title: "Paramètres",
    account: {
      title: "Compte",
      signedInPrefix: "Connecté",
      cloudBackupOn: "Sauvegarde cloud activée",
      taxSeasonPaid: "Saison fiscale · Payé ✓",
      notSignedIn:
        "Non connecté · Les données seront perdues si vous changez de téléphone",
      backupHint:
        "Connectez-vous avec Google pour sauvegarder vos reçus avant de changer de téléphone.",
      googleCta: "Continuer avec Google",
      signOut: "Se déconnecter",
      signOutTitle: "Se déconnecter ?",
      signOutWarning:
        "Vos reçus restent sauvegardés dans le cloud. Les copies locales restent sur cet appareil.",
      signOutRequiresOnline:
        "Connectez-vous à Internet pour vous déconnecter.",
      signOutFailed: "Impossible de se déconnecter. Réessayez.",
      signingOut: "Déconnexion…",
      coverageEnds: "Coverage ends {date}",
    },
    header: {
      localeEn: "EN",
      localeFr: "FR",
      localeDe: "DE",
    },
    preferencesList: {
      language: "Language",
      industry: "Your Industry",
      notifications: "Notification Settings",
      privacyCenter: "Privacy & Security Center",
      notificationsOn: "{count} on",
    },
    language: {
      title: "Langue",
      english: "English",
      french: "Français",
      german: "Deutsch",
    },
    industry: {
      title: "Votre secteur",
      labels: {
        truck_driver: "Chauffeur routier",
        plumber: "Plombier",
        electrician: "Électricien",
        construction: "Construction",
        delivery: "Livraison",
        general: "1099 général",
      },
    },
    taxOverview: {
      taxSaved: "Est. Tax Saved",
      receipts: "Receipts",
      deductions: "Deductions",
      income: "Revenus",
      incomeForms: "{count} formulaires",
    },
    exportCard: {
      compatLine: "Compatible TurboTax et H&R Block",
      formatLine: "TurboTax CSV · Pack CPA · TXF",
      snap1099Nec: "Photo 1099-NEC",
      snap1099K: "Photo 1099-K",
      trustLine: "Utilisé par des milliers de travailleurs indépendants",
      taxEstimateDisclaimer:
        "Est. Tax Saved est une estimation, pas un conseil fiscal. Voir Conditions §6.",
      mostPopular: "Le plus populaire",
      states: {
        final_deadline: {
          title: "Dossier fiscal final prêt",
          cta: "Exporter le dossier fiscal final",
        },
        anon: {
          title: "Débloquer le dossier fiscal IRS",
          cta: "Aperçu export exemple",
        },
        unpaid: {
          title: "Exporter le dossier IRS {season}",
          cta: "Débloquer pour {price}",
        },
        paid_new: {
          title: "Dossier fiscal {season} débloqué",
          cta: "Télécharger le dossier fiscal",
        },
        paid_exported: {
          title: "Prêt pour la déclaration",
          cta: "Exporter à nouveau",
        },
      },
    },
    notifications: {
      title: "Notifications",
      comingSoon: "Coming soon",
      deadlines: "Quarterly Tax Deadlines",
      deductions: "New Deduction Opportunities",
      receipts: "Receipt Processing",
      marketing: "Marketing Updates",
      footnoteAlertsSoon:
        "Alerts coming soon — your choices are saved for when we enable notifications.",
    },
    exportFlow: {
      sampleTitle: "Here's your sample tax export",
      downloadCsv: "Download CSV",
      continueGoogle: "Continue with Google",
      completedTitle: "Export Completed",
      viewStatus: "View status",
    },
    exportBanners: {
      sampleReady: "Sample export ready",
      downloadAgain: "Download again",
      exportBlocked:
        "Export blocked. Premium license required to download official IRS documents.",
      dismiss: "Dismiss",
    },
    privacyCenter: {
      title: "Privacy & Security Center",
      gotIt: "Got it",
      points: [
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
    },
    share: {
      sectionHeading: "Partager & parrainer",
      rowLabel: "Partager l'app et parrainer des amis",
      whatsappTitle: "Partager via WhatsApp",
      whatsappSubtitle: "Envoyer à votre groupe de travail ou un collègue",
      facebookTitle: "Partager via Facebook",
      facebookSubtitle: "Publier sur votre fil ou dans un groupe",
      moreTitle: "Plus d'options",
      moreSubtitle: "SMS, e-mail, AirDrop et plus",
      message:
        "Salut — j'utilise Snap1099 pour suivre mes reçus 1099 et économiser sur mes impôts. Gratuit pour les indépendants — ça pourrait t'intéresser :",
      shareTitle: "Snap1099 — Reçus vers dossier fiscal IRS",
      linkCopied: "Lien copié",
      shareFailed: "Partage impossible. Lien copié à la place.",
    },
    privacyData: {
      title: "Confidentialité et données",
      privacy: "Politique de confidentialité",
      terms: "Conditions d'utilisation",
      dataStorage: "Stockage des données",
      dataStorageValue:
        "Traitées et stockées aux États-Unis. Voir la Politique de confidentialité pour les transferts internationaux.",
      dataStorageOpenPrivacy: "Ouvrir la Politique de confidentialité",
      contactPrefix: "Contact",
      contactDsrNote:
        "Demandes de confidentialité : accusé de réception sous 48 h, réponse sous 30 jours.",
      dataRetention: "Conservation des données",
      security: "Sécurité & incidents",
      allPolicies: "Toutes les politiques",
      englishOnlyNotice: "Ce document est disponible en anglais uniquement.",
      loadingLegal: "Chargement…",
      legalLoadFailed:
        "Impossible de charger ce document. Réessayez ou ouvrez la page complète.",
      deleteAccount: "Supprimer le compte",
      deleteFailed: "Échec de la suppression. Veuillez réessayer.",
      deleteRequiresOnline:
        "Connectez-vous à Internet pour supprimer votre compte et vos données cloud.",
      deleteSessionExpired:
        "Votre session Google a expiré. Reconnectez-vous avec Google, puis supprimez votre compte.",
      deleteTitle: "Supprimer le compte",
      deleteSignedInWarning:
        "Cette action est irréversible. Tous les reçus cloud et les données du compte seront définitivement supprimés.",
      deleteGhostWarning:
        "Efface tous les reçus sur cet appareil et les données Ghost cloud. Action irréversible.",
      deleting: "Suppression...",
      deletePermanently: "Supprimer définitivement",
      cancel: "Annuler",
    },
    preferences: {
      title: "Préférences et actions",
    },
    export: {
      title: "Export fiscal",
      button: "Exporter le pack fiscal IRS",
      buttonLocked: "Exporter pack IRS {season} (49 $)",
      buttonPaid: "Exporter à nouveau",
      exporting: "Export en cours…",
      shareText: "Votre export de dépenses prêt pour l'IRS",
      offline: "Vous êtes hors ligne. Connectez-vous pour exporter.",
      noReceipts:
        "Aucun reçu terminé à exporter. Photographiez d'abord quelques reçus !",
      failed: "Échec de l'export. Veuillez réessayer.",
      failedAfterPayment:
        "Échec de l'export après paiement. Essayez Exporter à nouveau.",
      paymentConfirmed:
        "Paiement confirmé. Appuyez sur Exporter à nouveau pour télécharger.",
    },
    help: {
      title: "Aide",
      button: "Comment utiliser Snap1099",
      hint: "Guides rapides pour photographier, sauvegarder et exporter.",
    },
  },
  help: {
    pageTitle: "Aide",
    backToApp: "< BACK",
    backToTopics: "< BACK",
    allTopics: "Tous les sujets",
    contact: "Besoin d'aide ? snaptax.lightxforge@gmail.com",
    tocTitle: "Sujets",
    toc: {
      quickStart: "Démarrage rapide (30 s)",
      snapReceipt: "Photographier un reçu",
      homeScreen: "Écran d'accueil",
      googleBackup: "Sauvegarder avec Google",
      taxExport: "Export saison fiscale",
      faq: "Questions fréquentes",
      privacy: "Vos données",
    },
    sections: {
      quickStart: {
        title: "Commencer en 30 secondes",
        steps: [
          "Ouvrez Snap1099. **Pas d'inscription.**",
          "Appuyez sur le gros bouton jaune **PHOTOGRAPHIER UN REÇU**.",
          "Pointez la caméra sur le reçu. Appuyez sur l'obturateur. **C'est fait — retour au travail.**",
          "Avec du réseau, l'app lit le reçu et affiche le montant.",
          "**Économie fiscale estimée** en haut augmente.",
        ],
        closing:
          "C'est tout. Connectez-vous avec **Continuer avec Google** avant de changer de téléphone.",
      },
      snapReceipt: {
        title: "Photographier un reçu",
        stepsTitle: "Étapes",
        steps: [
          "Appuyez sur **PHOTOGRAPHIER UN REÇU** (gros bouton jaune).",
          "La caméra s'ouvre en plein écran.",
          "Tenez le reçu à plat. Appuyez sur l'obturateur.",
          "Retour immédiat à l'accueil. **Pas besoin de vérifier la netteté.**",
        ],
        tipsTitle: "Conseils",
        tips: [
          "**Bonne lumière** aide. Évitez les reflets.",
          "Un reçu par photo, c'est l'idéal.",
          "**Mode rafale :** continuez — **TERMINÉ ET VÉRIFIER** quand vous avez fini.",
        ],
        blurryTitle: "Photo floue",
        blurry:
          "La liste affiche en rouge **Reçu flou. Appuyez pour reprendre**. Appuyez sur la ligne pour une nouvelle photo.",
        offlineTitle: "Pas d'internet ?",
        offline:
          "Vous pouvez quand même photographier. Le reçu reste sur le téléphone avec **Traitement...** et **Envoi en cours**. Il s'envoie automatiquement avec le réseau.",
      },
      homeScreen: {
        title: "L'écran d'accueil",
        rows: [
          {
            label: "**Économie fiscale estimée** (jaune, en haut)",
            meaning:
              "Estimation approximative. **Pas un conseil fiscal officiel.**",
          },
          {
            label: "**PHOTOGRAPHIER UN REÇU**",
            meaning: "Prendre une photo d'un reçu.",
          },
          {
            label: "**Traitement...** + **Envoi en cours**",
            meaning: "Enregistré. Attente réseau ou IA.",
          },
          {
            label: "**45,20 $** + **ESSENCE CAMION**",
            meaning: "Terminé. Montant et catégorie pro.",
          },
          {
            label: "**Personnel (non déductible)**",
            meaning: "Achat perso — ne compte pas dans l'économie.",
          },
          {
            label: "Icône engrenage (en haut à droite)",
            meaning: "**Paramètres** — export, compte, secteur.",
          },
          {
            label: "**TIRER POUR ACTUALISER**",
            meaning: "Tirez la liste vers le bas pour synchroniser.",
          },
        ],
        filtersNote:
          "Filtres en bas : **Tout** · **Terminé** · **En cours** · **Flou**",
      },
      googleBackup: {
        title: "Ne perdez pas vos reçus",
        whyTitle: "Pourquoi se connecter ?",
        why: [
          "Sauvegarde les reçus dans le cloud.",
          "**Obligatoire avant de changer de téléphone.**",
          "Mêmes données sur téléphone, tablette ou ordinateur.",
        ],
        howTitle: "Comment",
        how: [
          "Engrenage → **Paramètres**.",
          "Appuyez sur **Continuer avec Google**.",
          "Choisissez votre compte Google. Terminé.",
        ],
        staySame:
          "**Vos reçus restent identiques** — rien ne bouge ni ne se réinitialise.",
        warningTitle: "Important",
        warnings: [
          "**Non connecté + nouveau téléphone = données perdues.** Pas de récupération.",
          "Connectez-vous **avant** de changer ou perdre votre téléphone.",
        ],
        multiDeviceTitle: "Voir sur tous les appareils",
        multiDevice:
          "**Paramètres** → **Voir sur tous les appareils**. Même **compte Google** sur chaque appareil.",
      },
      taxExport: {
        title: "Exporter pour les impôts",
        when:
          "Photographiez toute l'année — **payez seulement à l'export.** Généralement janvier–avril (saison fiscale US).",
        whatTitle: "Ce que vous obtenez",
        what: [
          "**CSV pour TurboTax** — import dans TurboTax ou autre logiciel.",
          "**Pack audit CPA** — ZIP avec tableau et photos pour votre comptable.",
        ],
        stepsTitle: "Étapes",
        steps: [
          "**Paramètres** → **Exporter le pack fiscal IRS**",
          "Connectez-vous avec Google (si pas encore fait).",
          "**49 $** une fois par saison fiscale (via Paddle).",
          "Choisissez l'année fiscale et le format.",
          "Partagez le fichier — e-mail, WhatsApp ou Fichiers.",
        ],
        afterPayTitle: "Après le paiement",
        afterPay: [
          "**Exporter à nouveau** autant que vous voulez **cette saison**.",
          "Les nouveaux reçus sont inclus.",
          "Prochaine saison = nouveau **49 $**.",
        ],
        beforePay:
          "Lisez l'avertissement jaune : **Connectez-vous avec Google avant de changer de téléphone.**",
      },
      faq: {
        title: "Questions fréquentes",
        items: [
          {
            q: "Faut-il un compte pour photographier ?",
            a: "Non. Photographiez d'abord. Connectez-vous plus tard pour sauvegarder.",
          },
          {
            q: "Photographier est gratuit ?",
            a: "Oui. **49 $** seulement à l'export pour la saison fiscale.",
          },
          {
            q: "J'ai photographié sans réseau. Mon reçu est-il en sécurité ?",
            a: "Oui. Il est sur le téléphone. Il s'envoie quand vous êtes en ligne.",
          },
          {
            q: "Pourquoi c'est encore « Traitement... » ?",
            a: "Attente réseau ou serveur. Tirez pour actualiser. Appuyez sur la ligne pour réessayer.",
          },
          {
            q: "J'ai photographié mon déjeuner par erreur.",
            a: "L'IA peut marquer **Personnel (non déductible)**. Ça ne compte pas.",
          },
          {
            q: "Qu'est-ce que « Économie fiscale estimée » ?",
            a: "Une estimation. **Pas** ce que l'IRS vous doit. Demandez à un CPA.",
          },
          {
            q: "Nouveau téléphone. Où sont mes reçus ?",
            a: "Snap1099 → **Continuer avec Google** avec le **même compte**. Ils se synchronisent.",
          },
          {
            q: "Jamais connecté, nouveau téléphone.",
            a: "Désolé — impossible à récupérer.",
          },
          {
            q: "Payé mais pas d'export.",
            a: "Attendez quelques secondes. Essayez **Exporter à nouveau**. Vérifiez internet.",
          },
          {
            q: "Tout supprimer ?",
            a: "**Paramètres** → **Confidentialité et données** → **Supprimer le compte**.",
          },
        ],
      },
      privacy: {
        title: "Vos données",
        paragraphs: [
          "Les photos de reçus sont stockées en sécurité aux **États-Unis** en ligne.",
          "L'IA lit les reçus. Nous **ne vendons pas** vos données. Pas de pub.",
        ],
        privacyLink: "Politique de confidentialité",
        termsLink: "Conditions d'utilisation",
      },
    },
  },
  exportEngine: {
    title: "Exporter le pack fiscal",
    close: "Fermer",
    stepLabel: "Étape {step} sur {total}",
    step1Heading: "Sélectionner l'année fiscale",
    step2Heading: "Vérifier les catégories",
    stepFormatHeading: "Choisir le format d'export",
    step3Heading: "Votre pack fiscal",
    yearCard: "Année fiscale {year}",
    yearRange: "1er janv. – 31 déc. {year}",
    deductionsLabel: "Déductions fiscales estimées : {amount}",
    receiptsLabel: "{count} reçus enregistrés",
    noReceiptsYear: "Aucun reçu pour cette année",
    noDeductibleReceipts:
      "Pas encore de reçus déductibles. Photographiez vos reçus professionnels !",
    continue: "Continuer →",
    back: "← Retour",
    generate: "Générer →",
    generating: "Création de votre pack…",
    ready: "Votre pack fiscal est prêt",
    saveToPhone: "Enregistrer sur le téléphone",
    share: "Partager le pack fiscal →",
    shareUnsupportedHint:
      "Appuyez sur Enregistrer, puis joignez ce fichier depuis Téléchargements par e-mail ou WhatsApp.",
    shareFailedHint:
      "Partage impossible. Appuyez sur Enregistrer sur le téléphone.",
    savedToPhoneHint:
      "Enregistré sur votre téléphone. Consultez Téléchargements pour joindre ou envoyer.",
    yearSummary: "{year} · {amount} · {count} reçus",
    formatCsvTitle: "CSV TurboTax",
    formatCsvHint:
      "Format matriciel optimisé pour un import instantané dans les logiciels fiscaux.",
    formatCpaTitle: "Pack de reçus d'audit 1099 (ZIP)",
    formatCpaHint:
      "Photos originales classées par ligne IRS — votre filet de sécurité en cas d'audit.",
    sharing: "Ouverture du menu de partage…",
    imagesComplete: "{included} sur {eligible} images de reçus incluses",
    imagesMissing: "{missing} images de reçus n'ont pas pu être incluses",
    sharingHint:
      "Appuyez à nouveau sur Partager si vous avez fermé le menu",
    reviewHint:
      "Ces reçus nécessitent une catégorie avant que votre CPA ou logiciel fiscal puisse les utiliser.",
    reviewUnknownMerchant: "Commerçant inconnu",
    reviewSaving: "Enregistrement…",
    reviewSaveFailed:
      "Impossible d'enregistrer la catégorie. Réessayez.",
    formatCpaPdfTitle: "PDF miroir Schedule C",
    formatCpaPdfHint:
      "Toutes les lignes Part II du Schedule C IRS — à recopier dans FreeTaxUSA ou sur papier.",
    formatTxfTitle: "TXF pour logiciel fiscal",
    formatTxfHint:
      "Format assistant comptable pour outils fiscaux (blocs V042).",
    snap1099Title: "Formulaires 1099 (revenus)",
    snap1099Hint:
      "Photographiez votre 1099-NEC ou 1099-K — inclus dans le pack d'audit sous 01_Income_Documents.",
    snap1099NecButton: "1099-NEC →",
    snap1099KButton: "1099-K →",
    incomeFormsLabel: "{count} formulaires revenus (1099)",
    turboTaxSteps: [
      "Ouvrez TurboTax Self-Employed → Business",
      "Choisissez Import / Upload expenses from CSV",
      "Sélectionnez ce fichier CSV Snap1099",
      "Associez les colonnes si demandé (Date, Amount, Category)",
    ],
    previewCsv: "Aperçu CSV en local",
    previewCsvHint:
      "Aperçu hors ligne instantané sans liens vers les images de reçus. L'export complet ajoute des URL signées.",
    progressPreparing: "Préparation des dépenses…",
    progressFetchingImages: "Récupération des images de reçus…",
    progressBuildingPdf: "Création du PDF…",
    progressFinalizing: "Finalisation de votre pack…",
    pdfFailed:
      "Échec de l'export PDF. Essayez CSV ou le pack CPA, ou réessayez plus tard.",
    exportTimeout:
      "Délai d'export dépassé. Vérifiez votre connexion et réessayez.",
  },
};
