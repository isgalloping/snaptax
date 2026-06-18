import type { UserCopy } from "../types";

export const DE_DE_COPY: UserCopy = {
  app: {
    description:
      "Belege fotografieren, automatisch kategorisieren. Einfache 1099-Buchführung.",
  },
  pwa: {
    title: "Snap1099 zum Startbildschirm hinzufügen",
    subtitle:
      "Wie eine native App öffnen — Belege einhändig auf der Baustelle fotografieren",
    install: "Installieren",
    howToInstall: "So fügen Sie hinzu",
    dismiss: "Nicht jetzt",
    dismissInstallAria: "Installationsanweisungen schließen",
    manualHint: "Tippen Sie in Chrome auf ⋮, dann App installieren",
    manualSheetTitle: "Snap1099 installieren",
    manualSheetLead:
      "Ihr Browser kann nicht automatisch installieren — folgen Sie diesen Schritten:",
    manualGotIt: "Verstanden",
    installWebApkLead:
      'Wählen Sie „App installieren" — kein Lesezeichen-Shortcut. Snap1099 öffnet sich vollständig vom Startbildschirm.',
    launchFromHomeHint:
      "Öffnen Sie Snap1099 über das Startbildschirm-Symbol, nicht in Chrome.",
    launchFromHomeGotIt: "Verstanden",
    manualSteps: {
      chromiumAndroid: [
        'Tippen Sie auf ⋮ (oben rechts in Chrome), dann auf „App installieren" (kein Shortcut).',
        'Bestätigen — Snap1099 öffnet sich vom Startbildschirm wie eine native App.',
      ],
      chromiumDesktop: [
        "Tippen Sie auf das ⋮-Menü (oben rechts in Chrome oder Edge).",
        'Tippen Sie auf „Apps" → „Snap1099 installieren" (oder „Diese Website installieren").',
        "Bestätigen — Snap1099 öffnet sich in einem eigenen Fenster.",
      ],
      iosSafari: [
        "Tippen Sie unten in Safari auf die Teilen-Schaltfläche (Quadrat mit Pfeil).",
        'Scrollen Sie und tippen Sie auf „Zum Home-Bildschirm".',
        'Tippen Sie auf „Hinzufügen" — öffnen Sie Snap1099 vom Home-Bildschirm.',
      ],
      macosSafari: [
        "Tippen Sie in der Safari-Symbolleiste auf die Teilen-Schaltfläche.",
        'Wählen Sie „Zum Dock hinzufügen".',
        "Snap1099 erscheint in Ihrem Dock wie eine native App.",
      ],
    },
  },
  camera: {
    opening: "Kamera wird geöffnet…",
    openFailed: "Kamera konnte nicht geöffnet werden. Bitte erneut versuchen.",
    captureFailed: "Aufnahme fehlgeschlagen. Bitte erneut versuchen.",
    retry: "Erneut versuchen",
    chooseGallery: "Aus Galerie wählen",
    takePhoto: "Foto aufnehmen",
    takePhotoAria: "Foto aufnehmen",
    flashDoneLine1: "Blitz",
    flashDoneLine2: "Fertig",
    flashDoneAria: "Blitz fertig",
    doneReviewLine1: "Fertig",
    doneReviewLine2: "prüfen",
    doneReviewAria: "Fertig und prüfen",
    batchReviewAria: "Neuesten Stapel prüfen",
    batchLabel: "Stapel {count}",
    review: {
      delete: "Löschen",
      deleteReceipt: "Beleg löschen",
      deleteFromBatch: "Beleg aus Stapel löschen",
      resnap: "Erneut fotografieren",
      resnapReceipt: "Beleg erneut fotografieren",
      done: "Fertig",
      acceptReceipt: "Beleg akzeptieren",
    },
    gallery: {
      latest: "Neuestes Belegfoto",
      selected: "Ausgewähltes Belegfoto",
      accepted: "Akzeptiertes Belegfoto",
      default: "Belegfoto",
    },
    errors: {
      notAllowed:
        "Kamerazugriff ist erforderlich, um Belege zu fotografieren. Erlauben Sie die Kamera in Ihren Browsereinstellungen.",
      notFound: "Keine Kamera gefunden",
      notReadable: "Kamera wird von einer anderen App verwendet",
      abort: "Kamera konnte nicht geöffnet werden. Bitte erneut versuchen.",
      default: "Kamera konnte nicht geöffnet werden. Bitte erneut versuchen.",
    },
  },
  offline: {
    label: "OFFLINE",
    title: "Sie sind offline",
    body: "Sie können weiterhin Belege fotografieren. Sie werden hochgeladen, sobald Sie wieder online sind.",
    backHome: "Zurück zur Startseite",
  },
  onboarding: {
    landing: {
      headlineLead: "Behalten Sie mehr von Ihrem",
      headlineAccent: "harte Arbeit verdienten Geld.",
      tagline: "KI findet Steuerabzüge, die andere übersehen.",
      check1: "Funktioniert offline",
      check2: "10 Belege in 10 Sek.",
      check3: "Keine Anmeldung nötig",
      cta: "Los geht's! ⚡",
      ctaCountdown: "Los geht's! ({seconds})",
      ctaAria: "Onboarding starten",
      ariaStatus: "Snap1099 wird geladen",
    },
    snapCoach:
      "Tippen Sie auf SNAP RECEIPT — fotografieren Sie jeden Geschäftsbeleg.",
    dismissCoach: "Hinweis schließen",
    skip: "Überspringen",
    skipAria: "Onboarding-Tutorial überspringen",
    firstReceipt: {
      processing:
        "Beleg wird gelesen… Jederzeit weitere Belege fotografieren.",
      done: "Hinzugefügt! Geschätzte Steuerersparnis wird oben aktualisiert.",
      blurry: "Zu unscharf — tippen Sie auf die Zeile zum erneuten Fotografieren.",
    },
    googleNudge:
      "Neues Handy? Mit Google anmelden, um Belege zu speichern.",
    googleNudgeDismiss: "Nicht jetzt",
    aha: {
      snapTooltip:
        "Hier tippen, um ein Foto zu machen und Ihre Steuerersparnis sofort zu sehen.",
      sandboxShutterAria: "Beispielbeleg fotografieren",
      sandboxTooltip:
        "Tippen Sie auf den Auslöser, um Ihren Beispielbeleg zu fotografieren.",
      snackbar: "Sie haben gerade 28,50 $ gespart!",
      signup: {
        title: "Steuerersparnis sichern",
        body: "Sie haben gerade Ihre ersten 28,50 $ gespart! Erstellen Sie jetzt Ihren sicheren lokalen Tresor und sichern Sie Ihre Steuerersparnis dauerhaft.",
        later: "Später",
      },
    },
  },
  home: {
    taxHeader: {
      title: "Geschätzte Steuerersparnis",
      receiptSingular: "Beleg",
      receiptPlural: "Belege",
      tracked: "erfasst",
      exportTaxPack: "Steuerpaket exportieren",
      cpaIrsReady: "CPA /IRS Ready",
      installApp: "App installieren",
      syncReceipts: "Belege synchronisieren",
      settings: "Einstellungen",
      filterReceipts: "Filter receipts",
    },
    snapButton: {
      title: "Beleg fotografieren",
      resnapSubtitle: "Diesen Beleg erneut fotografieren",
      subtitle: "Machen Sie ein Foto Ihres Belegs",
    },
    receiptList: {
      filters: {
        all: "ALLE",
        ready: "BEREIT",
        review: "PRÜFEN",
        action: "AKTION",
        processing: "IN BEARBEITUNG",
      },
      recentReceipts: "Neueste Belege",
      pullToRefresh: "Zum Aktualisieren ziehen",
      emptyFirst: "Fotografieren Sie Ihren ersten Beleg, um zu starten",
      emptyFilter: "Keine Belege in diesem Filter",
      uploadPaused: "UPLOAD PAUSIERT",
      analysisPaused: "ANALYSE PAUSIERT",
      photoMissingTitle: "FOTO FEHLT",
      photoMissingSubtitle: "Tippen zum erneuten Fotografieren",
      uploading: "WIRD HOCHGELADEN...",
      tapToRetry: "Tippen zum erneuten Versuch",
      processing: "In Bearbeitung",
      receiptBlurry: "Beleg unscharf",
      needAction: "Aktion erforderlich",
      resnap: "Erneut fotografieren",
      unknownMerchant: "Unbekannter Händler",
      duplicateReceipt: "Dieser Beleg ist bereits in Ihrer Liste.",
      status: {
        analyzing: "ANALYSE",
        uploading: "UPLOAD",
        paused: "PAUSIERT",
      },
    },
    trustBar: {
      message: "Die IRS sieht Ihre Belege nie.",
      learnMore: "Mehr erfahren",
    },
    widgets: {
      deadline: {
        label: "Nächste Frist",
        dueInDays: "In {days} Tagen",
        daysShort: "{days} Tage",
        projectedPayment: "Geschätzte Zahlung: {amount}",
        viewDetails: "Details",
      },
      missing: {
        label: "Mehr Ersparnisse finden",
        amountInDeductions: "{amount} an Abzügen",
        amountShort: "{amount} an Abzügen",
        review: "Prüfen",
      },
      progress: {
        label: "Steuerjahr {year}",
        percentComplete: "{pct} % des Steuerjahrs abgeschlossen",
        percentShort: "{pct} % abgeschlossen",
        projectedSavings: "Prognostizierte Ersparnis: {amount}",
      },
      cpa: {
        label: "CPA /IRS Ready",
        receiptsOrganized: "{count} receipts organized",
        export: "Export",
        subcopy: "Excel tax pack",
      },
      needAction: {
        label: "Need Action",
        actionCount: "{count} Beleg(e) erfordern Aktion",
        resnap: "RESNAP NOW",
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
      deadlineTitle: "Fristdetails",
      daysLeft: "Noch {days} Tage",
      income: "Einkommen",
      expenses: "Ausgaben",
      netProfit: "Nettogewinn",
      taxYearTitle: "Steuerjahr {year}",
      yearComplete: "Abgeschlossen",
      percentOfYear: "{pct} % des Steuerjahrs abgeschlossen",
      daysElapsed: "Vergangene Tage",
      daysElapsedValue: "{elapsed} von {total}",
      projectedSavingsLabel: "Prognostizierte Ersparnis",
      missingTitle: "Mögliche Abzüge",
      startTracking: "Start Tracking",
    },
  },
  receiptDetail: {
    close: "Schließen",
    uploadPaused: "Upload pausiert",
    analysisPaused: "Analyse pausiert",
    calculating: "Ihre Abzüge werden berechnet...",
    mayTakeSeconds: "Dies kann einige Sekunden dauern.",
    dateCapturedLong: "📅 Aufnahmedatum: {date}",
    retryUpload: "Upload erneut versuchen",
    retryAnalysis: "Analyse erneut versuchen",
    blurryTitle: "⚠️ Steuer-KI konnte dies nicht lesen",
    blurryBody: "Das Bild ist zu unscharf oder verwackelt.",
    partialDetails: "Teilweise Details",
    possibleMerchant: "Möglicher Händler: {merchant}",
    dateCaptured: "Aufnahmedatum: {date}",
    merchant: "Händler",
    totalAmount: "Gesamtbetrag",
    category: "Kategorie",
    irsLine: "IRS-Zeile",
    blurryPreview: "Unscharfe Vorschau",
    originalCapture: "Originalbeleg-Aufnahme",
    tapToEnlarge: "Tippen zum Vergrößern",
    tapToZoom: "Tippen zum Zoomen",
    encryptionNote:
      "🛡 Fotos sind auf diesem Gerät verschlüsselt, bis sie hochgeladen werden. Nach dem Upload wird Ihr Beleg sicher auf unseren Servern gespeichert.",
    thumbnailAlt: "Belegminiatur",
    photoOffline: "Foto verfügbar, wenn Sie wieder online sind",
    photoMissing: "Foto nicht auf diesem Gerät",
    loadingPhoto: "Foto wird geladen…",
    delete: "Löschen",
    deleteReceipt: "Beleg löschen",
    resnap: "Erneut fotografieren",
    resnapReceipt: "Beleg erneut fotografieren",
    deleteConfirmTitle: "Diesen Beleg löschen?",
    deleteConfirmBody: "Er wird aus Ihren Abzügen entfernt.",
    cancel: "Abbrechen",
    stepperAria: "Verarbeitungsfortschritt",
    stepperPhoto: "Foto",
    stepperAnalyzing: "Analyse",
    stepperCalculating: "Berechnung",
    zoomAria: "Belegfoto-Zoom",
    zoomOut: "Verkleinern",
    zoomIn: "Vergrößern",
    resetZoom: "Zoom zurücksetzen (1:1)",
    receiptAlt: "Beleg",
    partialMerchantUnknown: "Unbekannt (unklar)",
    partialMerchantUnclear: "{merchant} (unklar)",
    hero: {
      personalEu: "Private Ausgabe — keine MwSt.-Erstattung",
      personalUs: "Privat (nicht abzugsfähig)",
      addedVat: "✓ Zur MwSt.-Erstattung hinzugefügt",
      addedScheduleC: "✓ Zu Schedule-C-Abzug hinzugefügt",
    },
  },
  paywall: {
    unlockTitle: "Unlock Your Full Tax Pack — $49",
    maybeLater: "Maybe later",
    unlockNow: "Unlock now — $49",
    features: [
      "Export unlimited receipts",
      "CPA-ready Excel tax pack",
      "All tax categories & reports",
      "Deduction finder insights",
      "Secure & IRS compliant",
    ],
    oneTimeSeason: "Einmalig für Steuersaison {season}",
    description:
      "Exportieren Sie eine IRS-fertige Excel-Datei — an Ihren CPA senden oder in TurboTax importieren. Spart Stunden manueller Eingabe.",
    backupWarning:
      "Melden Sie sich mit Google an, bevor Sie das Handy wechseln, sonst gehen lokale Daten verloren.",
    openingPaddle: "Paddle wird geöffnet…",
    payButton: "49 $ mit Paddle bezahlen",
    paymentUnavailable: "Zahlung nicht verfügbar. Paddle ist nicht konfiguriert.",
    paymentFailed: "Zahlung fehlgeschlagen. Bitte erneut versuchen.",
    confirmingPayment: "Zahlung wird bestätigt…",
    confirmingPaymentHint:
      "Ihre Zahlung ist eingegangen. Wir schalten Ihren Steuersaison-Export frei.",
    openingExport: "Export wird geöffnet…",
    back: "< ZURÜCK",
  },
  auth: {
    googleSignIn: {
      soft: {
        title: "Belege speichern",
        body: "Mit Google anmelden, um Belege und Steuerdaten zu sichern. Erforderlich vor dem Handywechsel.",
      },
      hardExport: {
        title: "Zum Exportieren anmelden",
        body: "Der Export Ihres Steuerpakets erfordert eine Identitätsprüfung. Bitte mit Google anmelden.",
      },
      hardSync: {
        title: "Auf allen Geräten anzeigen",
        body: "Zum Synchronisieren zwischen Handy, Tablet oder Computer mit Google anmelden.",
      },
      signingIn: "Anmeldung…",
      preparingGoogle: "Google-Anmeldung wird geladen…",
      continueWithGoogle: "Mit Google fortfahren",
      notNow: "Nicht jetzt",
      back: "< ZURÜCK",
      signInFailed: "Anmeldung fehlgeschlagen. Bitte erneut versuchen.",
      signInUnauthorized:
        "Sitzung abgelaufen. Seite aktualisieren und erneut versuchen.",
      signInGhostBound:
        "Dieses Gerät ist bereits mit einem anderen Google-Konto verknüpft.",
      signInServerError:
        "Dienst vorübergehend nicht verfügbar. Bitte später erneut versuchen.",
      signInConfig: "Google-Anmeldung ist in diesem Build nicht konfiguriert.",
      ghostRegisterFailed:
        "Gerätesitzung konnte nicht gestartet werden. Verbindung prüfen.",
      syncAfterSignInFailed:
        "Angemeldet, aber Sync läuft noch. Ihre Belege sind auf diesem Gerät sicher.",
      onboardingSignup: {
        title: "Steuerersparnis sichern",
        body: "Sie haben gerade Ihre ersten 28,50 $ gespart! Erstellen Sie jetzt Ihren sicheren lokalen Tresor und sichern Sie Ihre Steuerersparnis dauerhaft.",
        later: "Später",
      },
    },
    syncInstructions: {
      title: "Auf allen Geräten anzeigen",
      steps: [
        "1. Öffnen Sie Snap1099 auf Ihrem anderen Handy, Tablet oder Computer.",
        "2. Tippen Sie auf Einstellungen und wählen Sie Mit Google fortfahren.",
        "3. Melden Sie sich mit demselben Google-Konto an — Belege synchronisieren sich automatisch.",
      ],
      gotIt: "Verstanden",
    },
  },
  legal: {
    compliance: {
      prefix: "Durch das Fotografieren stimmen Sie unseren ",
      terms: "AGB",
      middle: " und unserer ",
      privacy: "Datenschutzerklärung",
      suffix:
        " zu. Die Online-Verarbeitung speichert Daten in den Vereinigten Staaten.",
    },
  },
  settings: {
    back: "< ZURÜCK",
    title: "Einstellungen",
    account: {
      title: "Konto",
      signedInPrefix: "Angemeldet",
      cloudBackupOn: "Cloud-Backup aktiv",
      taxSeasonPaid: "Steuersaison · Bezahlt ✓",
      notSignedIn:
        "Nicht angemeldet · Daten gehen bei Handywechsel verloren",
      backupHint:
        "Mit Google anmelden, um Belege vor dem Handywechsel zu sichern.",
      googleCta: "Weiter mit Google",
      signOut: "Abmelden",
      signOutTitle: "Abmelden?",
      signOutWarning:
        "Ihre Belege bleiben in der Cloud gesichert. Lokale Kopien bleiben auf diesem Gerät.",
      signOutRequiresOnline:
        "Stellen Sie eine Internetverbindung her, um sich abzumelden.",
      signOutFailed: "Abmeldung fehlgeschlagen. Bitte erneut versuchen.",
      signingOut: "Abmeldung…",
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
      title: "Sprache",
      english: "English",
      french: "Français",
      german: "Deutsch",
    },
    industry: {
      title: "Ihre Branche",
      labels: {
        truck_driver: "LKW-Fahrer",
        plumber: "Installateur",
        electrician: "Elektriker",
        construction: "Bau",
        delivery: "Lieferung",
        general: "Allgemein 1099",
      },
    },
    taxOverview: {
      taxSaved: "Est. Tax Saved",
      receiptsTracked: "Receipts Tracked",
      totalDeductions: "Total Deductions",
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
      cta: "Tell a fellow 1099 contractor to get 1 Year Free",
      footnote: "Share with 3 friends — reward program coming soon",
      learnHow: "Learn how it works",
      learnSheetTitle: "Refer a fellow contractor",
      learnSheetBody:
        "Share Snap1099 with other 1099 workers. When our referral program launches, you'll earn 1 year free for every 3 friends who export their tax pack.",
      whatsapp: "WhatsApp",
      facebook: "Facebook",
      more: "Mehr",
      message:
        "Ich nutze Snap1099 für Belege und einen IRS-fertigen Steuerexport. Probieren Sie es:",
      shareTitle: "Snap1099 — Belege zum IRS-Steuerpaket",
      linkCopied: "Link kopiert",
      shareFailed: "Teilen fehlgeschlagen. Link stattdessen kopiert.",
    },
    privacyData: {
      title: "Datenschutz und Daten",
      privacy: "Datenschutzerklärung",
      terms: "Nutzungsbedingungen",
      dataStorage: "Datenspeicherung",
      dataStorageValue:
        "Verarbeitung und Speicherung in den Vereinigten Staaten. Internationale Übermittlungen siehe Datenschutzerklärung.",
      contactPrefix: "Kontakt",
      deleteAccount: "Konto löschen",
      deleteFailed: "Löschen fehlgeschlagen. Bitte erneut versuchen.",
      deleteRequiresOnline:
        "Verbinden Sie sich mit dem Internet, um Ihr Konto und Cloud-Daten zu löschen.",
      deleteTitle: "Konto löschen",
      deleteSignedInWarning:
        "Dies ist unwiderruflich. Alle Cloud-Belege und Kontodaten werden dauerhaft gelöscht.",
      deleteGhostWarning:
        "Löscht alle Belege auf diesem Gerät und Ghost-Daten in der Cloud. Nicht rückgängig zu machen.",
      deleting: "Wird gelöscht...",
      deletePermanently: "Dauerhaft löschen",
      cancel: "Abbrechen",
    },
    preferences: {
      title: "Einstellungen",
    },
    export: {
      title: "Steuerexport",
      button: "IRS-Steuerpaket exportieren",
      buttonLocked: "IRS-Steuerpaket {season} exportieren (49 $)",
      buttonPaid: "Erneut exportieren",
      exporting: "Export läuft…",
      shareText: "Ihr IRS-fertiger Ausgabenexport",
      offline: "Sie sind offline. Verbinden Sie sich zum Exportieren.",
      noReceipts:
        "Keine abgeschlossenen Belege zum Exportieren. Fotografieren Sie zuerst einige Belege!",
      failed: "Export fehlgeschlagen. Bitte erneut versuchen.",
      failedAfterPayment:
        "Export nach Zahlung fehlgeschlagen. Versuchen Sie Erneut exportieren.",
      paymentConfirmed:
        "Zahlung bestätigt. Tippen Sie auf Erneut exportieren zum Herunterladen.",
    },
    help: {
      title: "Hilfe",
      button: "So nutzen Sie Snap1099",
      hint: "Kurzanleitungen für Fotos, Backup und Steuerexport.",
    },
  },
  help: {
    pageTitle: "Hilfe",
    backToApp: "< BACK",
    backToTopics: "< BACK",
    allTopics: "Alle Themen",
    contact: "Weitere Fragen? legal@snap1099.com",
    tocTitle: "Themen",
    toc: {
      quickStart: "Schnellstart (30 Sek.)",
      snapReceipt: "Beleg fotografieren",
      homeScreen: "Startbildschirm",
      googleBackup: "Mit Google sichern",
      taxExport: "Steuerexport",
      faq: "Häufige Fragen",
      privacy: "Ihre Daten",
    },
    sections: {
      quickStart: {
        title: "In 30 Sekunden starten",
        steps: [
          "Snap1099 öffnen. **Keine Anmeldung nötig.**",
          "Auf den großen gelben Button **BELEG FOTOGRAFIEREN** tippen.",
          "Kamera auf den Beleg richten. Auslöser tippen. **Fertig — weiterarbeiten.**",
          "Mit Internet liest die App den Beleg und zeigt den Betrag.",
          "**Geschätzte Steuerersparnis** oben steigt.",
        ],
        closing:
          "Das war's. Später mit **Mit Google fortfahren** anmelden, bevor Sie ein neues Handy bekommen.",
      },
      snapReceipt: {
        title: "Beleg fotografieren",
        stepsTitle: "Schritte",
        steps: [
          "Auf **BELEG FOTOGRAFIEREN** tippen (großer gelber Button).",
          "Die Handy-Kamera öffnet sich im Vollbild.",
          "Beleg flach halten. Auslöser tippen.",
          "Sofort zurück auf dem Startbildschirm. **Kein Prüfen nötig.**",
        ],
        tipsTitle: "Tipps",
        tips: [
          "**Gutes Licht** hilft. Blendung vermeiden.",
          "Ein Beleg pro Foto ist am besten.",
          "**Serienmodus:** weiter fotografieren — **FERTIG & ÜBERPRÜFEN** wenn fertig.",
        ],
        blurryTitle: "Unscharfes Foto",
        blurry:
          "Die Liste zeigt rot **Beleg unscharf. Tippen zum Neufotografieren**. Zeile antippen für neues Foto.",
        offlineTitle: "Kein Internet?",
        offline:
          "Fotografieren geht trotzdem. Beleg bleibt auf dem Handy mit **Wird verarbeitet...** und **Wird hochgeladen**. Bei Internet lädt er automatisch hoch.",
      },
      homeScreen: {
        title: "Der Startbildschirm",
        rows: [
          {
            label: "**Geschätzte Steuerersparnis** (gelb, oben)",
            meaning:
              "Grobe Schätzung. **Keine offizielle Steuerberatung.**",
          },
          {
            label: "**BELEG FOTOGRAFIEREN**",
            meaning: "Foto vom Beleg machen.",
          },
          {
            label: "**Wird verarbeitet...** + **Wird hochgeladen**",
            meaning: "Gespeichert. Wartet auf Internet oder KI.",
          },
          {
            label: "**45,20 $** + **LKW-TANKEN**",
            meaning: "Fertig. Betrag und Kategorie.",
          },
          {
            label: "**Privat (nicht absetzbar)**",
            meaning: "Privatausgabe — zählt nicht zur Ersparnis.",
          },
          {
            label: "Zahnrad (oben rechts)",
            meaning: "**Einstellungen** — Export, Konto, Branche.",
          },
          {
            label: "**ZUM AKTUALISIEREN ZIEHEN**",
            meaning: "Liste nach unten ziehen zum Synchronisieren.",
          },
        ],
        filtersNote:
          "Filter unten: **Alle** · **Fertig** · **In Bearbeitung** · **Unscharf**",
      },
      googleBackup: {
        title: "Belege nicht verlieren",
        whyTitle: "Warum anmelden?",
        why: [
          "Sichert Belege in der Cloud.",
          "**Pflicht vor dem Handywechsel.**",
          "Gleiche Daten auf Handy, Tablet oder PC.",
        ],
        howTitle: "So geht's",
        how: [
          "Zahnrad → **Einstellungen**.",
          "**Mit Google fortfahren** tippen.",
          "Google-Konto wählen. Fertig.",
        ],
        staySame:
          "**Ihre Belege bleiben gleich** — nichts wird verschoben oder zurückgesetzt.",
        warningTitle: "Wichtig",
        warnings: [
          "**Nicht angemeldet + neues Handy = Daten weg.** Keine Wiederherstellung.",
          "Vor Handytausch oder Verlust **anmelden**.",
        ],
        multiDeviceTitle: "Auf allen Geräten",
        multiDevice:
          "**Einstellungen** → **Auf allen Geräten anzeigen**. Gleiches **Google-Konto** auf jedem Gerät.",
      },
      taxExport: {
        title: "Export zur Steuerzeit",
        when:
          "Das ganze Jahr fotografieren — **nur beim Export zahlen.** Meist Januar–April (US-Steuersaison).",
        whatTitle: "Was Sie bekommen",
        what: [
          "**CSV für TurboTax** — Import in TurboTax oder andere Software.",
          "**CPA-Audit-Paket** — ZIP mit Tabelle und Belegfotos für den Steuerberater.",
        ],
        stepsTitle: "Schritte",
        steps: [
          "**Einstellungen** → **IRS-Steuerpaket exportieren**",
          "Mit Google anmelden (falls noch nicht).",
          "**49 $** einmal pro Steuersaison (über Paddle).",
          "Steuerjahr und Dateityp wählen.",
          "Datei teilen — E-Mail, WhatsApp oder Speichern.",
        ],
        afterPayTitle: "Nach der Zahlung",
        afterPay: [
          "**Erneut exportieren** beliebig oft **diese Saison**.",
          "Neue Belege danach sind dabei.",
          "Nächste Steuersaison = neue **49 $**.",
        ],
        beforePay:
          "Gelbe Warnung lesen: **Mit Google anmelden vor dem Handywechsel.**",
      },
      faq: {
        title: "Häufige Fragen",
        items: [
          {
            q: "Brauche ich ein Konto zum Fotografieren?",
            a: "Nein. Erst fotografieren. Später anmelden zum Backup.",
          },
          {
            q: "Ist Fotografieren kostenlos?",
            a: "Ja. **49 $** nur beim Steuerexport.",
          },
          {
            q: "Ohne Empfang fotografiert. Ist der Beleg sicher?",
            a: "Ja. Er ist auf dem Handy. Upload bei Internet.",
          },
          {
            q: "Warum noch „Wird verarbeitet...“?",
            a: "Wartet auf Internet oder Server. Zum Aktualisieren ziehen. Zeile antippen zum Wiederholen.",
          },
          {
            q: "Aus Versehen Mittagessen fotografiert.",
            a: "KI markiert **Privat (nicht absetzbar)**. Zählt nicht zur Ersparnis.",
          },
          {
            q: "Was ist „Geschätzte Steuerersparnis“?",
            a: "Nur Schätzung. **Nicht** der IRS-Betrag. CPA fragen.",
          },
          {
            q: "Neues Handy. Wo sind meine Belege?",
            a: "Snap1099 → **Mit Google fortfahren** mit **gleichem Konto**. Sync zurück.",
          },
          {
            q: "Nie angemeldet, neues Handy.",
            a: "Leider nicht wiederherstellbar.",
          },
          {
            q: "Bezahlt, aber kein Export.",
            a: "Kurz warten. **Erneut exportieren** versuchen. Internet prüfen.",
          },
          {
            q: "Alles löschen?",
            a: "**Einstellungen** → **Datenschutz & Daten** → **Konto löschen**.",
          },
        ],
      },
      privacy: {
        title: "Ihre Daten",
        paragraphs: [
          "Belegfotos werden online sicher in den **Vereinigten Staaten** gespeichert.",
          "KI liest Belege. Wir **verkaufen keine** Daten. Keine Werbung.",
        ],
        privacyLink: "Datenschutzerklärung",
        termsLink: "Nutzungsbedingungen",
      },
    },
  },
  exportEngine: {
    title: "Steuerpaket exportieren",
    close: "Schließen",
    stepLabel: "Schritt {step} von {total}",
    step1Heading: "Steuerjahr auswählen",
    step2Heading: "Kategorien prüfen",
    stepFormatHeading: "Exportformat wählen",
    step3Heading: "Ihr Steuerpaket",
    yearCard: "Steuerjahr {year}",
    yearRange: "1. Jan. – 31. Dez. {year}",
    deductionsLabel: "Geschätzte Steuerabzüge: {amount}",
    receiptsLabel: "{count} Belege erfasst",
    noReceiptsYear: "Keine Belege für dieses Jahr",
    noDeductibleReceipts:
      "Noch keine absetzbaren Belege. Fotografieren Sie Geschäftsbelege!",
    continue: "Weiter →",
    back: "← Zurück",
    generate: "Erstellen →",
    generating: "Paket wird erstellt…",
    ready: "Bereit zum Teilen",
    share: "Steuerpaket teilen →",
    yearSummary: "{year} · {amount} · {count} Belege",
    formatCsvTitle: "CSV für TurboTax / Steuersoftware",
    formatCsvHint:
      "Optimiertes Matrixformat für sofortigen Import in Steuersoftware.",
    formatCpaTitle: "CPA-Prüfpaket (ZIP + Belegbilder)",
    formatCpaHint:
      "IRS-konformer Prüfpfad mit Ihren originalen Belegfotos.",
    sharing: "Teilen-Menü wird geöffnet…",
    imagesComplete: "{included} von {eligible} Belegbildern enthalten",
    imagesMissing: "{missing} Belegbilder konnten nicht eingeschlossen werden",
    sharingHint:
      "Tippen Sie erneut auf Teilen, wenn Sie das Menü geschlossen haben",
    reviewHint:
      "Diese Belege benötigen eine Kategorie, bevor Ihr CPA oder Ihre Steuersoftware sie verwenden kann.",
    reviewUnknownMerchant: "Unbekannter Händler",
    reviewSaving: "Wird gespeichert…",
    reviewSaveFailed:
      "Kategorie konnte nicht gespeichert werden. Erneut versuchen.",
    formatCpaPdfTitle: "CPA-Zusammenfassung PDF (Links zu Belegen)",
    formatCpaPdfHint:
      "IRS-konforme Zusammenfassung mit anklickbaren Links zu Ihren Belegfotos.",
    turboTaxSteps: [
      "Öffnen Sie TurboTax Self-Employed → Business",
      "Wählen Sie Import / Upload expenses from CSV",
      "Wählen Sie diese Snap1099-CSV-Datei",
      "Ordnen Sie Spalten zu, falls gefragt (Date, Amount, Category)",
    ],
    previewCsv: "CSV lokal anzeigen",
    previewCsvHint:
      "Sofortige Offline-Vorschau ohne Belegbild-Links. Vollständiger Export fügt signierte URLs hinzu.",
    progressPreparing: "Ausgaben werden vorbereitet…",
    progressFetchingImages: "Belegbilder werden abgerufen…",
    progressFinalizing: "Paket wird fertiggestellt…",
  },
};
