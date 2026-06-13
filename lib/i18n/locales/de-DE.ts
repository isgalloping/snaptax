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
    manualHint: "Tippen Sie in Chrome auf ⋮, dann App installieren",
    manualSheetTitle: "Snap1099 installieren",
    manualSheetLead:
      "Ihr Browser kann nicht automatisch installieren — folgen Sie diesen Schritten:",
    manualGotIt: "Verstanden",
    manualSteps: {
      chromiumAndroid: [
        "Tippen Sie auf das ⋮-Menü (oben rechts in Chrome).",
        'Tippen Sie auf „App installieren" oder „Zum Startbildschirm hinzufügen".',
        "Bestätigen — Snap1099 öffnet sich vom Startbildschirm wie eine native App.",
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
      headline: "SNAP1099",
      tagline:
        "Belege → Steuerersparnis. Für die Baustelle entwickelt.",
      step1: "Foto machen — wir sortieren Ihre Geschäftsausgaben.",
      step2: "Funktioniert offline. Synchronisiert bei Verbindung.",
      step3: "Privat und sicher. AGB · Datenschutz.",
      cta: "Jetzt fotografieren →",
      ctaAria: "Belege fotografieren starten",
      ariaStatus: "Snap1099 wird geladen",
    },
    snapCoach:
      "Tippen Sie auf SNAP RECEIPT — fotografieren Sie jeden Geschäftsbeleg.",
    dismissCoach: "Hinweis schließen",
    firstReceipt: {
      processing:
        "Beleg wird gelesen… Jederzeit weitere Belege fotografieren.",
      done: "Hinzugefügt! Geschätzte Steuerersparnis wird oben aktualisiert.",
      blurry: "Zu unscharf — tippen Sie auf die Zeile zum erneuten Fotografieren.",
    },
    googleNudge:
      "Neues Handy? Mit Google anmelden, um Belege zu speichern.",
    googleNudgeDismiss: "Nicht jetzt",
  },
  home: {
    taxHeader: {
      title: "Geschätzte Steuerersparnis",
      receiptSingular: "Beleg",
      receiptPlural: "Belege",
      tracked: "erfasst",
      installApp: "App installieren",
      syncReceipts: "Belege synchronisieren",
      settings: "Einstellungen",
    },
    snapButton: {
      title: "Beleg fotografieren",
      resnapSubtitle: "Diesen Beleg erneut fotografieren",
      subtitle: "Machen Sie ein Foto Ihres Belegs",
    },
    receiptList: {
      filters: {
        all: "ALLE",
        done: "FERTIG",
        processing: "IN BEARBEITUNG",
        blurry: "UNSCHARF",
        stuckAria: "Hängende Belege",
      },
      title: "Alle lokalen Belege",
      refresh: "Zum Aktualisieren ziehen",
      emptyFirst: "Fotografieren Sie Ihren ersten Beleg, um zu starten",
      emptyFilter: "Keine Belege in diesem Filter",
      uploadPaused: "UPLOAD PAUSIERT",
      analysisPaused: "ANALYSE PAUSIERT",
      uploading: "WIRD HOCHGELADEN...",
      tapToRetry: "Tippen zum erneuten Versuch",
      processing: "In Bearbeitung",
      receiptBlurry: "Beleg unscharf",
      needAction: "Aktion erforderlich",
      resnap: "Erneut fotografieren",
      unknownMerchant: "Unbekannter Händler",
      status: {
        analyzing: "ANALYSE",
        uploading: "UPLOAD",
        paused: "PAUSIERT",
      },
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
    multiDevice: {
      title: "Mehrere Geräte",
      button: "Auf allen Geräten anzeigen",
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
      deleteTitle: "Konto löschen",
      deleteSignedInWarning:
        "Dies ist unwiderruflich. Alle Cloud-Belege und Kontodaten werden dauerhaft gelöscht.",
      deleteGhostWarning:
        "Löscht alle Belege auf diesem Gerät und Ghost-Daten in der Cloud. Nicht rückgängig zu machen.",
      deleting: "Wird gelöscht...",
      deletePermanently: "Dauerhaft löschen",
      cancel: "Abbrechen",
    },
    export: {
      title: "Steuersaison-Export",
      button: "IRS-Steuerpaket exportieren",
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
