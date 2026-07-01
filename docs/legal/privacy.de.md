# Snap1099 Datenschutzerklärung

**Zuletzt aktualisiert:** Juni 2026  
**Anwendbare Rechtsordnungen:** Vereinigte Staaten (einschließlich Kalifornien CPRA) & Europäische Union (DSGVO)

Willkommen bei Snap1099. Diese Datenschutzerklärung erläutert, wie wir Ihre Daten erheben, verwenden, verarbeiten und schützen, wenn Sie die Snap1099-Anwendung („die App") nutzen.

## 1. Datenschutz by Design & Dateneigentum

Wir minimieren die Datenerhebung auf das für Belegkategorisierung und Steuersaison-Exporte Erforderliche gemäß **DSGVO Artikel 13** und **California Privacy Rights Act (CPRA)**.

**Sie besitzen Ihre Geschäftsbelegdaten.** Wir verarbeiten sie als Auftragsverarbeiter, um Organisation und Export zu ermöglichen. Wir verkaufen Ihre Daten nicht und nutzen sie nicht für Werbung.

### Ghost / anonyme Nutzung (vor Google-Anmeldung)

Bei erster Nutzung weisen wir eine zufällige **Ghost-ID** auf Ihrem Gerät zu.

- **Offline:** Belegfotos und extrahierte Daten bleiben **auf Ihrem Gerät** in verschlüsseltem Browserspeicher, bis Sie wieder online sind.
- **Nach Upload:** Bilder werden auf unseren **US**-Servern gespeichert (siehe §6); lokale Vollauflösungskopien können gemäß unserer [Aufbewahrungsrichtlinie](/data-retention) entfernt werden.
- **Online:** Bei Netzwerkverbindung senden wir Belegbilder an unsere **US**-Server und **OpenAI** (über unsere API) zur Analyse und Kategorisierung. Ergebnisse werden in der App angezeigt und Ihrer Ghost-ID zugeordnet.
- **Name und E-Mail** erheben wir erst nach **Google-Anmeldung**.

### Nach Google-Anmeldung

Mit Google-Anmeldung verknüpfen wir Ihre Ghost-ID mit Ihrem Konto für geräteübergreifende Synchronisation. Ihre Daten verbleiben auf derselben **US**-Infrastruktur wie unten beschrieben.

## 2. Erhobene Daten

| Kategorie | Beispiele | Zweck |
|-----------|-----------|-------|
| Belegbilder | Fotos, die Sie aufnehmen | OCR / KI-Kategorisierung, Export |
| Belegmetadaten | Händler, Datum, Betrag, Kategorie | Anzeige, Steuerschätzungen, Export |
| Kontodaten | Google-E-Mail, Anzeigename (bei Anmeldung) | Identität, Sync, Support |
| Zahlungsmetadaten | Paddle-Transaktionsreferenzen | Steuersaison-Export-Berechtigung |
| Technische Logs | Request-IDs, Fehlercodes (keine Belegbilder) | Sicherheit, Zuverlässigkeit |

### Nicht erhobene Daten

- Präziser GPS-Standort.
- Kontakte, andere Apps oder Cross-Site-Browsing-Verlauf.

## 3. Google-Anmeldung

Google Sign-In nutzen wir nur für Identität, Sicherheit und Multi-Device-Sync.

- **Berechtigungen:** nur `profile` und `email`.
- **Kein Zugriff** auf Gmail, Drive, Fotos oder Kalender.
- Wir sehen oder speichern Ihr Google-Passwort nie.

## 4. KI-Verarbeitung

Wenn Sie **online** sind, werden Belegbilder (und optional lokaler OCR-Text) über unsere Server an **OpenAI** zur Analyse gesendet.

- **Kein Modelltraining:** OpenAI-API-Daten werden **nicht** zum Trainieren ihrer Modelle verwendet (gemäß OpenAI-API-Bedingungen).
- **Datenminimierung:** Wir senden nur das für Händler, Beträge, Kategorien und ähnliche Felder Erforderliche.
- **Steuerbeträge:** Geschätzte Steuerersparnisse (`tax_amount`) werden auf unseren Servern nach dokumentierten Formeln berechnet — **KI ändert nicht autonom Finanzbuchungsfelder oder Export-Status.**

## 5. Unterauftragsverarbeiter

| Anbieter | Zweck |
|----------|-------|
| **OpenAI** | Belegbildanalyse **online** (auch vor Anmeldung); API-Daten nicht für Training |
| **Paddle** | Zahlungsabwicklung Steuersaison-Export |
| **Google** | OAuth-Authentifizierung |
| **Vercel / Neon / Blob** | Hosting, Datenbank, Bildspeicher (**Vereinigte Staaten**) |

Alle Übermittlungen nutzen **TLS 1.3**. Unterauftragsverarbeiter sind vertraglich gebunden.

## 6. Speicherung & internationale Übermittlungen

Ihre Belegbilder und zugehörigen Daten werden sicher auf **verschlüsselten Cloud-Servern in den Vereinigten Staaten** gespeichert.

Mit Nutzung der App und Zustimmung zu diesen Bedingungen und der Datenschutzerklärung (einschließlich beim Online-Fotografieren eines Belegs) **erkennen Sie ausdrücklich an**, dass Ihre Daten in den USA verarbeitet werden, wo andere Datenschutzgesetze gelten können.

Wir schützen internationale Übermittlungen durch branchenübliche Verschlüsselung (**TLS 1.3** und **AES-256** at rest, soweit unterstützt) und geeignete Mechanismen, einschließlich:

- Einhaltung des **EU-U.S. Data Privacy Framework** durch Infrastrukturpartner, wo anwendbar, und
- **Standardvertragsklauseln (SCCs)**, wo das Framework nicht gilt.

## 7. Datenaufbewahrung

Wir bewahren Daten nur so lange auf, wie für die beschriebenen Zwecke nötig. Siehe unsere [Aufbewahrungsrichtlinie](/data-retention) für Fristen und Löschoptionen.

## 8. Kein Verkauf personenbezogener Daten (CPRA)

**Wir verkaufen Ihre personenbezogenen Daten nicht.**

- **Keine Werbung.**
- Wir **verkaufen oder teilen** Ihre Finanz- oder Belegdaten nicht mit Vermarktern, Versicherern oder Brokern für verhaltensbezogene Werbung.
- Einnahmen stammen nur aus Ihrem freiwilligen Steuersaison-Export-Kauf.

### Kalifornischer Hinweis bei Erhebung (letzte 12 Monate)

| Kategorie | Erhoben | An Dienstleister offengelegt | Verkauft |
|-----------|---------|-------------------------------|----------|
| Identifikatoren (Ghost-ID, E-Mail bei Anmeldung) | Ja | Ja (Hosting, Auth) | **Nein** |
| Finanz- / Belegdaten | Ja | Ja (KI, Speicher) | **Nein** |
| Kommerzielle Informationen (Export-Kauf) | Ja | Ja (Paddle) | **Nein** |
| Internet- / Geräteaktivität (Sicherheitslogs) | Ja | Ja (Hosting) | **Nein** |

## 9. Ihre Rechte (DSGVO & CPRA)

Je nach Standort haben Sie das Recht auf:

- **Auskunft** — Belege in der App einsehen oder via Tax Pack exportieren.
- **Berichtigung** — Belegdetails in der App korrigieren, wo unterstützt, oder uns kontaktieren.
- **Löschung** — **Konto löschen** in den Einstellungen (unwiderruflich; entfernt Server- und lokale Daten).
- **Datenübertragbarkeit** — strukturierte Daten via Tax Pack exportieren.
- **Einschränkung der Verarbeitung** — uns kontaktieren, wo anwendbar.
- **Widerspruch** — App-Nutzung beenden oder Konto löschen.

Wir antworten auf verifizierte Anfragen an **legal@snap1099.com** innerhalb von **30 Tagen** (Bestätigung innerhalb von 48 Stunden angestrebt). Verlängerung um 60 Tage, wo gesetzlich erlaubt, mit Mitteilung.

## 10. Sicherheit

Wir nutzen Verschlüsselung, Zugriffskontrollen und Monitoring für Finanzbelegdaten. Siehe unsere Zusammenfassung [Sicherheit & Vorfallreaktion](/security).

## 11. Kinder

Die App richtet sich nicht an Kinder unter 13 Jahren. Wir erheben wissentlich keine personenbezogenen Daten von Kindern.

## 12. Änderungen & Kontakt

Wir können diese Erklärung aktualisieren. Wesentliche Änderungen werden im Datum „Zuletzt aktualisiert" reflektiert. Fortgesetzte Nutzung gilt als Zustimmung, wo gesetzlich zulässig.

**Kontakt:** **legal@snap1099.com**
