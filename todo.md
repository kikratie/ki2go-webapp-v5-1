# KI2GO WebApp V5 - Project TODO

## Phase 1: Grundlagen - Design-System und Landing Page
- [x] KI2GO Farbpalette in CSS implementieren (Navy #1E3A5F, Türkis #5FBDCE, Orange #F97316)
- [x] Typografie-System einrichten
- [x] Landing Page mit Hero-Section erstellen
- [x] Suchfeld für natürliche Sprache
- [x] Quick-Action-Buttons für häufige Aufgaben
- [x] Filter-Dropdowns (Kategorien, Unternehmensbereiche)

## Phase 2: Benutzer-Authentifizierung und Dashboard-Layout
- [x] Login/Logout mit Manus OAuth
- [x] Dashboard-Layout mit Sidebar
- [x] Benutzer-Profil Anzeige
- [x] Rollen-basierte Navigation (User/Admin/Owner)

## Phase 3: Admin-Dashboard mit Kategorien, Bereichen und Superprompt-Verwaltung

### 3.1 Datenbank-Erweiterung
- [x] Tabelle `categories` erstellen (editierbare Kategorien)
- [x] Tabelle `business_areas` erstellen (editierbare Unternehmensbereiche)
- [x] Migration ausführen
- [x] Standard-Daten (8 Kategorien, 11 Bereiche) eingefügt

### 3.2 Backend-APIs für Kategorien & Bereiche
- [x] tRPC Router `category.list` - Alle Kategorien laden
- [x] tRPC Router `category.create` - Neue Kategorie erstellen
- [x] tRPC Router `category.update` - Kategorie bearbeiten
- [x] tRPC Router `category.delete` - Kategorie löschen
- [x] tRPC Router `category.reorder` - Kategorien sortieren
- [x] tRPC Router `businessArea.list` - Alle Bereiche laden
- [x] tRPC Router `businessArea.create` - Neuen Bereich erstellen
- [x] tRPC Router `businessArea.update` - Bereich bearbeiten
- [x] tRPC Router `businessArea.delete` - Bereich löschen
- [x] tRPC Router `businessArea.reorder` - Bereiche sortieren
- [x] Unit Tests für Category Router (8 Tests bestanden)

### 3.3 Backend-APIs für Superprompt-Templates
- [x] tRPC Router `template.list` - Alle Templates laden
- [x] tRPC Router `template.listActive` - Aktive Templates für Benutzer
- [x] tRPC Router `template.getById` - Template mit Variablen laden
- [x] tRPC Router `template.getBySlug` - Template per Slug laden
- [x] tRPC Router `template.create` - Neues Template erstellen
- [x] tRPC Router `template.update` - Template bearbeiten
- [x] tRPC Router `template.delete` - Template löschen
- [x] tRPC Router `template.duplicate` - Template kopieren
- [x] tRPC Router `template.toggleStatus` - Aktivieren/Deaktivieren
- [x] Unit Tests für Template Router (10 Tests bestanden)

### 3.4 Admin-Dashboard UI
- [x] Admin-Hauptseite mit Statistiken und Quick-Actions
- [x] Quick Stats (Kategorien, Bereiche, Templates)
- [x] Admin-Karten mit Navigation zu Unterbereichen
- [x] Schnellaktionen (Neue Kategorie, Neuer Bereich, Neues Template)

### 3.5 Kategorien-Verwaltung UI
- [x] Kategorien-Liste mit Tabelle und Status-Anzeige
- [x] Erstellen-Dialog mit Icon- und Farbauswahl
- [x] Bearbeiten-Dialog
- [x] Löschen-Dialog mit Bestätigung
- [ ] Drag & Drop Sortierung (später)

### 3.6 Unternehmensbereiche-Verwaltung UI
- [x] Bereiche-Liste mit Tabelle und Status-Anzeige
- [x] Erstellen-Dialog mit Icon-Auswahl
- [x] Bearbeiten-Dialog
- [x] Löschen-Dialog mit Bestätigung
- [ ] Drag & Drop Sortierung (später)

### 3.7 Template-Verwaltung UI
- [x] Template-Liste mit Filter (Kategorie, Bereich, Status)
- [x] Template-Editor Tab 1: Grunddaten (Name, Titel, Beschreibung, Kategorie, Bereich, Status)
- [x] Template-Editor Tab 2: Variablen-Schema (Felder definieren mit Typ, Label, Optionen)
- [x] Template-Editor Tab 3: Superprompt-Editor mit Variablen-Einfügung
- [x] Template-Editor Tab 4: Erweiterte Einstellungen (Zeitersparnis, Credits, Dateitypen)
- [ ] KI-Assistent für Superprompt-Erstellung (später)
- [x] Validierung: Alle Variablen im Superprompt müssen im Schema definiert sein

### 3.8 Metaprompt-Verwaltung & Superprompt-Generator
- [x] Datenbank: metapromptTemplates Tabelle erstellen
- [x] Backend: Metaprompt CRUD APIs (list, create, update, delete, setDefault)
- [x] Backend: Generator API (generateSuperprompt mit LLM)
- [x] Backend: Variablen-Extraktion API (extractVariables)
- [ ] Frontend: Metaprompt-Verwaltung Seite (/admin/metaprompts) - später
- [x] Frontend: Generator-Seite (/admin/generator)
- [x] Frontend: Metaprompt-Auswahl Dropdown
- [x] Frontend: Aufgabenbeschreibung Eingabe
- [x] Frontend: KI-Generierung Button mit Loading-State
- [x] Frontend: Automatische Variablen-Anzeige
- [x] Frontend: Variablen-Schema Editor
- [x] Frontend: Vorschau des generierten Superprompts
- [x] Frontend: Speichern als neues Template
- [x] Unit Tests für Metaprompt Router (8 Tests bestanden)

## Phase 4: Backend-APIs für Workflow-Ausführung
- [ ] tRPC Router für Intent-Erkennung
- [ ] tRPC Router für Superprompt-Generierung
- [ ] tRPC Router für LLM-Ausführung
- [ ] Workflow-Session Verwaltung

## Phase 5: Workflow-System Frontend für Benutzer
- [ ] 3-Schritt Workflow UI
- [ ] Variablen-Formular mit dynamischen Feldern
- [ ] Ergebnis-Anzeige mit Markdown-Rendering
- [ ] Download-Optionen (PDF, DOCX, TXT)

## Phase 6: Dokument-Upload und Verarbeitung
- [ ] Drag & Drop Upload Zone
- [ ] PDF/DOCX Text-Extraktion
- [ ] Smart Questions Generator
- [ ] S3 Storage Integration

## Phase 7: Geschäftsführer-Radar
- [ ] Nutzungs-Transparenz Dashboard
- [ ] Recherche-Radar (Bedarfs-Inkubator)
- [ ] ROI-Dashboard
- [ ] Upsell-Opportunities Tracking

## Phase 8: Testing und Finalisierung
- [ ] Vitest Unit Tests
- [ ] Responsive Design Prüfung
- [ ] Checkpoint erstellen
- [ ] Übergabe an Benutzer

## Bugfixes & Verbesserungen
- [x] Angemeldeten Benutzer im Header der Home-Seite anzeigen
- [x] Profil-Einstellungen Seite erstellen
- [x] Klarstellung: Owner/Admin/User Rollen-System


## Aktuelle Aufgaben (Neue Anforderung)
- [x] Standard-Metaprompt V1 erstellen und in Datenbank einfügen
- [x] Dokument-Anforderungen zum Template-Editor hinzufügen (Anzahl, Relevanz-Check, Masking) - bereits implementiert
- [x] Test-Template "Vertrag prüfen" mit dem Generator erstellen (via Seed-Script)

## Bugfixes
- [x] Superprompt-Generator Fehler beheben (SelectItem mit leerem value)

## Neue Features
- [x] Metaprompt-Verwaltungsseite (/admin/metaprompts) erstellen
- [x] Navigation zum Metaprompt-Editor im Admin-Bereich hinzufügen

- [x] BUG: Superprompt wird korrekt gespeichert (Datenbank-Prüfung bestätigt)
- [x] Audit-Protokoll für Templates hinzugefügt (uniqueId SP-YYYY-NNN, creationMethod, sourceMetapromptId)
- [x] Variablen-Schema wird korrekt übertragen

- [x] Intelligente Variablen-Vorschläge im Generator (Platzhalter, Hilfe-Texte, Optionen via LLM)

- [x] Import & Formatierungs-Funktion für extern erstellte Prompts
  - [x] Backend: Import-API mit Validierung und automatischer Formatierung
  - [x] Frontend: Import-Tab im Generator für Superprompts
  - [x] Frontend: Import-Tab im Metaprompt-Editor mit Validierung

- [x] "Metaprompt aus LLM einfügen" Option im Generator-Dropdown

- [x] BUG: variableSchema wird als null statt Array beim Speichern als Template übergeben - behoben

- [x] KRITISCH: Superprompt wird nicht als Template übernommen - BEHOBEN (fehlende Felder in list Query)
- [x] KRITISCH: Template-ID (uniqueId) funktioniert korrekt (SP-2026-001 in DB vorhanden)

- [x] BUG: variableSchema Key-Validierung akzeptiert jetzt Groß- und Kleinbuchstaben


## Phase 9: Multi-Tenant-Architektur und Aufgaben-Ausführung

### 9.1 Datenbank-Schema Erweiterung
- [x] Tabelle `organizations` erstellen (Firmen/Mandanten) - bereits vorhanden
- [x] Tabelle `organization_members` erstellen (User-Zuordnung mit Rollen) - bereits vorhanden
- [x] Tabelle `organization_templates` erstellen (Template-Freigaben pro Firma)
- [x] Tabelle `workflow_executions` erstellen (Ausführungs-Log)
- [x] Tabelle `workflow_feedback` erstellen (Bewertungen und Verbesserungsvorschläge)
- [x] Migration ausgeführt (0007_hard_dark_beast.sql)

### 9.2 Backend-APIs für Organisationen
- [x] tRPC Router `organization.list` - Alle Organisationen (Owner)
- [x] tRPC Router `organization.create` - Neue Organisation erstellen
- [x] tRPC Router `organization.getById` - Organisation mit Mitgliedern und Templates
- [x] tRPC Router `organization.update` - Organisation bearbeiten
- [x] tRPC Router `organization.delete` - Organisation löschen
- [x] tRPC Router `organization.addMember` - Mitglied hinzufügen
- [x] tRPC Router `organization.removeMember` - Mitglied entfernen
- [x] tRPC Router `organization.updateMemberRole` - Rolle ändern
- [x] tRPC Router `organization.assignTemplate` - Template zuweisen
- [x] tRPC Router `organization.removeTemplate` - Template entfernen
- [x] tRPC Router `organization.getAvailableTemplates` - Verfügbare Templates
- [x] tRPC Router `organization.getMyOrganization` - Meine Organisation
- [x] tRPC Router `organization.listUsers` - Alle Benutzer (Owner)
- [ ] tRPC Router `organization.update` - Organisation bearbeiten
- [ ] tRPC Router `organization.addMember` - Benutzer hinzufügen
- [ ] tRPC Router `organization.removeMember` - Benutzer entfernen
- [ ] tRPC Router `organization.assignTemplate` - Template freigeben
- [ ] tRPC Router `organization.removeTemplate` - Template-Freigabe entfernen

### 9.3 Backend-APIs für Workflow-Ausführung
- [x] tRPC Router `workflow.getAvailableTasks` - Templates für aktuellen User
- [x] tRPC Router `workflow.getTemplateForExecution` - Template mit Variablen laden
- [x] tRPC Router `workflow.execute` - LLM aufrufen und Ergebnis generieren
- [x] tRPC Router `workflow.getExecution` - Einzelne Ausführung mit Ergebnis abrufen
- [x] tRPC Router `workflow.getMyExecutions` - Meine Ausführungen
- [x] tRPC Router `workflow.submitFeedback` - Bewertung und Verbesserungsvorschläge

### 9.4 Frontend: Aufgaben-Ausführung
- [x] Aufgaben-Katalog Seite (/aufgaben) - nur freigegebene Templates
- [x] Aufgaben-Ausführungs-Seite (/aufgabe/:slug) mit 4-Schritt-Workflow
- [x] Schritt 1: Dokument-Upload (optional, mit Skip-Option und Warnung)
- [x] Schritt 2: Variablen-Formular (dynamisch aus Schema)
- [x] Schritt 3: Processing-Anzeige mit Fortschrittsbalken
- [x] Schritt 4: Ergebnis-Anzeige mit Markdown-Rendering (/ergebnis/:id)
- [ ] Download-Optionen (PDF, DOCX, TXT) - Placeholder
- [x] Bewertung (Daumen hoch/runter)
- [x] Verbesserungsvorschläge Formular

### 9.5 UI/UX Anforderungen
- [x] Keine AI-Terminologie ("Aufgabe" statt "Superprompt")
- [x] Dokument-Upload VOR Variablen-Eingabe
- [x] "Überspringen" Option mit Warnung (AlertDialog)
- [x] Resizable Textfelder (resize-y auf Textarea)
- [x] Strukturierte Ergebnis-Ausgabe (Markdown mit Streamdown)

### 9.6 Unit Tests
- [x] Workflow Router Tests (11 Tests bestanden)
  - getAvailableTasks (Owner/Member/No-Org)
  - getTemplateForExecution
  - execute
  - getExecution
  - getMyExecutions
  - submitFeedback

## Bugfixes (Neu)
- [x] BUG: Landing Page zeigt Platzhalter-Karten statt echte aktive Templates - BEHOBEN

## Phase 10: Anfrage-Funnel für individuelle Aufgaben-Lösungen

### 10.1 Datenbank
- [ ] Tabelle `task_requests` erstellen (Beschreibung, Kategorie, Bereich, Deadline, Status)

### 10.2 Backend-APIs
- [ ] tRPC Router `taskRequest.create` - Neue Anfrage erstellen
- [ ] tRPC Router `taskRequest.list` - Alle Anfragen (Owner)
- [ ] tRPC Router `taskRequest.updateStatus` - Status ändern
- [ ] tRPC Router `taskRequest.getMyRequests` - Eigene Anfragen

### 10.3 Frontend: Landing Page Umstrukturierung
- [ ] Hero-Section vereinfachen (ohne Suchfeld)
- [ ] "Verfügbare Aufgaben" Section oben
- [ ] "Ihre individuelle Anfrage" Section unten mit Formular
- [ ] Formular: Beschreibung, Kategorie, Bereich, Deadline
- [ ] Headline: "Beschreiben Sie Ihre Aufgabe – wir erstellen Ihnen ein unverbindliches Angebot"

## Phase 11: Verbesserungen Aufgaben-Ausführung

### 11.1 OCR-Prüfung bei Dokument-Upload
- [x] PDF-Lesbarkeit prüfen (Text vs. gescanntes Bild)
- [x] Warnung anzeigen wenn Dokument nicht maschinenlesbar (AlertDialog)
- [x] Empfehlung für bessere Dokumentformate (Info-Box)

### 11.2 Dokument-Voranalyse
- [x] Automatische Extraktion relevanter Informationen aus Dokument (simuliert)
- [x] Vorausfüllung der Variablen-Felder mit extrahierten Daten
- [x] Benutzer kann Vorschläge übernehmen oder ignorieren (Banner mit Buttons)

### 11.3 Verbesserte Feldbeschreibungen
- [x] Hilfetext für jedes Pflichtfeld (Tooltip mit HelpCircle Icon)
- [x] Erklärung der Funktion und Auswirkung (getFieldDescription)
- [x] Konkrete Beispiele für Eingaben (getFieldExample, als Placeholder)

## Bugfixes (27.01.2026)
- [x] BUG: Dokumente werden nicht tatsächlich gelesen/verarbeitet beim Upload - BEHOBEN (Backend document router mit S3-Upload und Text-Extraktion)
- [x] FEATURE: Home-Taste auf allen Seiten für einfache Navigation zurück zur Startseite - BEHOBEN (PageHeader Komponente auf Tasks, TaskExecution, TaskResult)

## Phase 12: Admin-Dashboard für Anfragen-Verwaltung

### 12.1 Backend-Erweiterung
- [x] taskRequest Router erweitern: list (alle Anfragen für Owner)
- [x] taskRequest Router: getById (Anfrage-Details)
- [x] taskRequest Router: updateStatus (Status ändern: offen → in_bearbeitung → angebot_erstellt → angenommen → abgelehnt)
- [x] taskRequest Router: sendOffer (Angebot erstellen mit Preis, Beschreibung, Lieferzeit)
- [x] taskRequest Router: getStats (Übersicht: offene, bearbeitete, angenommene Anfragen)

### 12.2 Admin-Dashboard UI
- [x] Neue Seite /admin/anfragen erstellen
- [x] Anfragen-Übersicht mit Tabelle (Datum, Beschreibung, Kategorie, Status, Deadline)
- [x] Filter nach Status (offen, in Bearbeitung, Angebot erstellt, angenommen, abgelehnt)
- [x] Suche nach Beschreibung/Kunde
- [x] Statistik-Karten (Neue Anfragen, In Prüfung, Angebote offen, Konversionsrate)

### 12.3 Anfrage-Detail und Angebotserstellung
- [x] Detail-Ansicht einer Anfrage mit allen Informationen (Dialog)
- [x] Status-Änderung mit Dropdown
- [x] Angebots-Formular (Preis, Beschreibung, Gültigkeit)
- [x] Interne Notizen für das Team
- [ ] Option: Neues Template aus Anfrage generieren (später)
- [ ] E-Mail-Benachrichtigung an Kunden (Placeholder)

### 12.4 Navigation
- [x] Admin-Sidebar: Link zu Anfragen-Verwaltung hinzugefügt (DashboardLayout)
- [x] Admin-Hauptseite: Anfragen-Karte mit Badge für neue Anfragen
- [x] Route /admin/anfragen in App.tsx registriert

## Bugfixes (27.01.2026 - Abend)
- [x] BUG: Dokument-Upload funktioniert nicht - Dateien werden nicht hochgeladen/verarbeitet
  - Ursache: Extrahierter Text enthielt Steuerzeichen die SQL-Insert störten
  - Lösung: Text-Bereinigung vor Datenbank-Insert hinzugefügt

## Phase 13: PDF-Extraktion und Download-Funktionen

### 13.1 Bessere PDF-Extraktion
- [x] pdf-parse Bibliothek installieren
- [x] PDF-Text-Extraktion mit pdf-parse implementieren
- [x] Fallback für fehlerhafte PDFs (Warnung bei gescannten PDFs)

### 13.2 Download-Funktionen für Ergebnisse
- [x] TXT-Export (Plain Text)
- [x] HTML-Export (für Word-Import)
- [x] Download-Buttons auf der Ergebnis-Seite
- [x] Export-Router im Backend implementiert


## Phase 15: Firmen-Onboarding und Subscription-System

### 15.1 Datenbank-Schema Erweiterung
- [x] Tabelle `subscriptionPlans` erstellen (id, name, price, userLimit, creditLimit, trialDays)
- [x] Tabelle `organizationSubscriptions` erstellen (orgId, planId, status, validUntil, credits)
- [x] Tabelle `organizationInvitations` erstellen (code, orgId, email, role, expiresAt)
- [x] Tabelle `creditTransactions` erstellen (orgId, userId, amount, reason, executionId)
- [x] Migration ausführen (0009_warm_gressill.sql)

### 15.2 Backend-APIs für Subscription
- [x] tRPC Router `subscription.getPlans` - Alle Pläne laden
- [x] tRPC Router `subscription.getStatus` - Aktueller Subscription-Status
- [x] tRPC Router `subscription.checkAccess` - Prüfen ob Zugriff erlaubt
- [x] tRPC Router `subscription.useCredit` - Credit abziehen bei Ausführung
- [x] tRPC Router `subscription.listAll` - Alle Subscriptions (Owner)
- [x] tRPC Router `subscription.extend` - Subscription verlängern (Owner)
- [x] tRPC Router `subscription.createPlan` - Plan erstellen (Owner)

### 15.3 Backend-APIs für Onboarding
- [x] tRPC Router `onboarding.registerCompany` - Firma registrieren (erstellt Org + Admin + Test-Abo)
- [x] tRPC Router `onboarding.createInvitation` - Einladungs-Link erstellen
- [x] tRPC Router `onboarding.joinByCode` - Mit Einladungs-Code beitreten
- [x] tRPC Router `onboarding.getInvitations` - Offene Einladungen laden
- [x] tRPC Router `onboarding.revokeInvitation` - Einladung widerrufen
- [x] tRPC Router `onboarding.getInvitationDetails` - Einladungs-Details (public)
- [x] tRPC Router `onboarding.checkRegistrationStatus` - Registrierungs-Status prüfen

### 15.4 Frontend: Firmen-Registrierung
- [x] Onboarding-Seite (/onboarding) mit Firmen-Formular
- [x] Firmenname, Branche, Mitarbeiteranzahl Eingabe
- [x] Automatische Test-Paket Aktivierung
- [x] Weiterleitung zum Admin-Dashboard nach Registrierung

### 15.5 Frontend: Admin-Dashboard für Firmen
- [x] Übersichts-Seite mit Testphase-Status (/firma/dashboard)
- [x] Verbleibende Tage Anzeige
- [x] User-Verwaltung Seite (/firma/users)
- [x] User einladen (E-Mail oder Link)
- [x] User-Liste mit Rollen
- [x] User entfernen

### 15.6 Frontend: Einladungs-System
- [x] Einladungs-Seite (/einladung/:code)
- [x] Validierung des Codes
- [x] Automatische Zuordnung zur Organisation nach Login

### 15.7 Frontend: Testphase-Ablauf
- [x] Banner-Komponente für Testphase-Hinweise (TrialBanner.tsx)
- [x] 14 Tage vorher: Gelber Hinweis
- [x] 7 Tage vorher: Oranger Hinweis
- [x] Nach Ablauf: Rote Warnung mit Upgrade-Option

### 15.8 Owner-Einstellungen
- [ ] Standard-Testlaufzeit konfigurierbar (System-Setting)
- [ ] Manuelles Verlängern einzelner Firmen
- [ ] Übersicht aller Firmen mit Ablaufdaten

### 15.9 Unit Tests
- [x] Tests für Subscription-APIs (66 Tests bestanden)
- [x] Tests für Onboarding-APIs
- [x] Tests für Invitation-System


## Phase 16: Owner Audit-, Qualitätskontroll- und Kosten-Tracking-System

### 16.1 Datenbank-Schema Erweiterung
- [x] Prozess-ID System (KI2GO-YYYY-NNNNN Format) - processAuditLog Tabelle
- [x] Kosten-Tracking Felder (inputTokens, outputTokens, totalCost, Kosten pro Komponente)
- [x] Dokument-Nutzungs-Tracking (documentUsage Tabelle)
- [x] Audit-Log Tabelle für Admin-Aktionen (adminAuditLog)
- [x] Kosten-Zusammenfassung (costSummary) für aggregierte Auswertungen
- [x] Echtzeit-Stats Cache (realtimeStatsCache)
- [x] Migration ausgeführt (0010_dark_tomorrow_man.sql)

### 16.2 Backend-APIs für Audit und Kosten
- [x] audit.getProcessLog - Alle Prozesse mit Kosten und Prozess-ID
- [x] audit.getOrganizations - Alle Firmen mit Mitgliedern, Kosten, Subscription-Status
- [x] audit.getUsers - Alle User mit Aktivitäten und Kosten
- [x] audit.getDocuments - Alle hochgeladenen Dokumente mit Nutzungs-Tracking
- [x] audit.getCostAnalytics - Kosten-Statistiken nach Zeitraum, Firma, Template
- [x] audit.getRealtimeStats - Echtzeit-Dashboard Daten
- [x] audit.exportData - JSON/CSV Export für alle Daten

### 16.3 Owner Dashboard: Firmen & User Übersicht
- [x] /admin/organizations - Alle Firmen mit Mitgliedern
- [x] Registrierungsdatum, Testphase-Status
- [x] Anzahl Aufgaben pro Firma
- [x] Kosten pro Firma
- [x] /admin/all-users - Alle User mit Aktivitäten

### 16.4 Owner Dashboard: Prozess-Protokoll
- [x] /admin/process-log - Vollständiges Prozess-Protokoll
- [x] Prozess-ID (KI2GO-2026-00001)
- [x] Wer (User + Firma)
- [x] Was (Aufgabe + Template-ID)
- [x] Welches Dokument
- [x] Ergebnis (Erfolg/Fehler)
- [x] Kosten (Input/Output Tokens, Gesamtkosten)
- [x] Detail-Dialog mit allen Informationen

### 16.5 Owner Dashboard: Kosten-Analytics
- [x] /admin/cost-analytics - Kosten-Dashboard
- [x] Kosten pro Tag/Woche/Monat/Jahr (wählbar)
- [x] Kosten pro Firma mit Fortschrittsbalken
- [x] Kosten pro Template/Aufgabe (Top 10)
- [x] Token-Verbrauch Statistiken
- [x] Durchschnittskosten pro Aufgabe

### 16.6 Owner Dashboard: Echtzeit-Statistiken
- [x] /admin/realtime - Echtzeit-Dashboard
- [x] Aktive User (24h)
- [x] Laufende Aufgaben
- [x] Fehler-Rate (7 Tage)
- [x] Ablaufende Subscriptions (14 Tage)
- [x] Automatische Aktualisierung alle 30 Sekunden
- [x] Statistiken: Heute, Diese Woche, Dieser Monat

### 16.7 Export-Funktionen
- [x] JSON/CSV Export für alle Daten (audit.exportData API)
- [x] Export für: Prozesse, User, Organisationen, Dokumente, Kosten


## Phase 17: Bug-Fix - User ohne Organisation können keine Aufgaben sehen

### Problem identifiziert:
- josef@hicka.at und niaghi@winitec.at haben `organizationId = NULL`
- In `workflow.ts` Zeile 528-530: `if (!ctx.user.organizationId) { return []; }`
- User ohne Organisation sehen KEINE Aufgaben (leere Liste)

### 17.1 Lösung (Variante B - Ordentliches Anmelde-System)
- [x] "Kostenlos starten" Button auf Home-Seite zur /onboarding Seite verlinken
- [x] Bestehende User (josef@hicka.at, niaghi@winitec.at) einer Test-Organisation zuweisen (Org-ID: 90001)
- [x] Test-Subscription für die Organisation erstellen (90 Tage, 1000 Credits)
- [x] Templates der Organisation zugewiesen (1 aktives Template)
- [ ] Testen ob der komplette Flow funktioniert


## Phase 18: Ergebnisse und Dokumente einsehbar machen

### Problem:
- Ergebnisse werden protokolliert, aber können nicht eingesehen werden
- Hochgeladene Dokumente sind nicht auffindbar

### 18.1 Analyse
- [x] Ergebnisse in workflowExecutions.result (TEXT Feld mit Markdown/JSON)
- [x] Dokumente in documents Tabelle mit S3-URL (fileUrl, originalName, mimeType)
- [x] Verknüpfung über workflowExecutions.documentIds (JSON Array)

### 18.2 Backend-APIs
- [x] API audit.getExecutionDetails - Einzelnes Ergebnis mit allen Details
- [x] API audit.getAllDocuments - Alle Dokumente mit Download-Links
- [x] API audit.getDocumentDetails - Einzelnes Dokument mit Nutzungshistorie

### 18.3 Admin-Seiten
- [x] Ergebnis-Detail-Ansicht im Prozess-Protokoll (bereits vorhanden)
- [x] Dokument-Übersicht mit Vorschau und Download (/admin/documents)
- [x] Dokument-Details mit Nutzungshistorie
- [x] Download-Links für alle Dokumente
- [ ] Verknüpfung zwischen Ausführung, Dokumenten und Ergebnis


## Phase 19: Kosten-Tracking aktivieren

### 19.1 LLM-Helper erweitern
- [x] Token-Verbrauch aus LLM-Antwort extrahieren (usage.prompt_tokens, usage.completion_tokens)
- [x] Kosten-Berechnung implementieren (Gemini 2.5 Flash: Input €0.00007/1K, Output €0.00028/1K)
- [x] Kosten-Berechnung direkt im Workflow-Router integriert

### 19.2 Workflow-Ausführung erweitern
- [x] Bei jeder LLM-Ausführung Token und Kosten erfassen
- [x] In workflowExecutions speichern (promptTokens, completionTokens, estimatedCost, llmModel)
- [x] Prozess-ID wird automatisch generiert (KI2GO-YYYY-NNNNN)

### 19.3 Testen
- [x] Tests erfolgreich (84 Tests bestanden)
- [x] Token-Verbrauch wird korrekt geloggt (z.B. Input=100, Output=200, Kosten=€0.000063)
- [x] Kosten werden in workflowExecutions.estimatedCost gespeichert


## Phase 21: Admin-Bereich Neustrukturierung

### 21.1 Backend-APIs erweitern
- [x] API audit.updateUser - User bearbeiten (Rolle, Organisation, Name)
- [x] API audit.assignUserToOrganization - User einer Organisation zuweisen
- [x] API audit.removeUserFromOrganization - User aus Organisation entfernen
- [x] API audit.createOrganization - Firma manuell anlegen
- [x] API audit.updateOrganization - Firma bearbeiten
- [x] API audit.extendSubscription - Subscription verlängern
- [x] API audit.getOrganizationUsers - Alle User einer Organisation

### 21.2 User-Bearbeitung
- [x] User-Detail-Dialog in /admin/all-users
- [x] Rolle ändern (user/admin)
- [x] Organisation zuweisen/entfernen
- [x] User-Info anzeigen (Aufgaben, Kosten)
- [ ] Organisation zuweisen/ändern
- [ ] User aktivieren/deaktivieren

### 21.3 Firmen-Verwaltung
- [x] Neue Firma manuell anlegen in /admin/organizations
- [x] Firma bearbeiten (Name, Branche)
- [x] Subscription verlängern (mit Schnellauswahl)
- [x] Link zu User-Verwaltung pro Firma

### 21.4 Admin-Dashboard neu strukturieren
- [x] Tab-basierte Gruppierung: Kunden, Produktion, Qualität, Einstellungen
- [x] Icons für bessere Übersicht
- [x] Schnellaktionen pro Bereich
- [x] Owner sieht alle Tabs, Admin nur Produktion und Einstellungen
- [ ] Rollenbasierte Sichtbarkeit


## Phase 22: Professionelle Registrierung und User-Verwaltung

### 22.1 Datenbank-Schema erweitern
- [x] User-Tabelle erweitern: companyName, position, phone, address, city, postalCode, country, industry, howFound
- [x] User-Status Feld: active, suspended, deleted
- [x] Consent-Tracking: termsAcceptedAt, privacyAcceptedAt
- [x] profileCompleted Flag
- [x] Migration ausgeführt (0012_closed_blockbuster.sql)

### 22.2 Backend-APIs
- [x] API user.getProfile - Aktuelles Profil abrufen
- [x] API user.checkProfileComplete - Prüfen ob Profil vollständig
- [x] API user.completeProfile - Profil vervollständigen nach Login
- [x] API user.updateProfile - Profil aktualisieren
- [x] API user.getOptions - Dropdown-Optionen (Branchen, Wie gefunden)
- [x] API user.list - Alle User auflisten (Owner)
- [x] API user.getById - Einzelnen User abrufen (Owner)
- [x] API user.setStatus - User sperren/entsperren (Owner)
- [x] API user.delete - User löschen DSGVO-konform (Owner)
- [x] API user.setRole - User-Rolle ändern (Owner)
- [x] API user.assignOrganization - User Organisation zuweisen (Owner)
- [x] API user.exportMyData - DSGVO Datenexport
- [x] API user.requestDeletion - DSGVO Account-Löschung beantragen

### 22.3 Profil-Vervollständigung Seite
- [x] /complete-profile Seite nach erstem Login
- [x] Pflichtfelder: Firmenname, AGB, Datenschutz
- [x] Optionale Felder: Position, Telefon, Adresse, Branche, Wie gefunden
- [ ] Redirect nach Login wenn Profil unvollständig (TODO: in Auth-Flow integrieren)

### 22.4 User-Verwaltung erweitern (/admin/all-users)
- [x] User löschen Button mit Bestätigung (AlertDialog)
- [x] User sperren/entsperren Toggle
- [x] Vollständiges Profil im Detail-Dialog anzeigen (Tabs: Profil, Einstellungen, Gefahrenzone)
- [x] Status-Anzeige (aktiv, gesperrt, gelöscht) mit farbigen Badges
- [x] Status-Filter (alle, aktiv, gesperrt, gelöscht)
- [x] CSV Export für User-Liste
- [x] DSGVO-konforme Löschung mit Checkbox-Option


## Phase 23: Automatische Profil-Vervollständigung nach Login

### 23.1 CompleteProfile Seite erweitern
- [x] Auswahl "Ich bin..." (Unternehmen/Selbstständig vs Privatperson)
- [x] Bei Privatperson: Firmenname = "Privat" (kein Pflichtfeld)
- [x] Bei Unternehmen: Firmenname ist Pflichtfeld
- [x] Position nur bei Unternehmen sichtbar
- [x] Branche nur bei Unternehmen sichtbar

### 23.2 Auth-Flow Integration
- [x] Nach Login automatisch checkProfileComplete aufrufen (in DashboardLayout)
- [x] Redirect zu /complete-profile wenn profileCompleted = false
- [x] Erst nach Vervollständigung Zugriff auf Dashboard/Aufgaben

### 23.3 Backend-Anpassungen
- [x] userType Feld hinzugefügt (business/private) in DB und Schema
- [x] Validierung angepasst (Firmenname nur bei business Pflicht)
- [x] completeProfile API erweitert für userType


## Phase 24: AGB, Datenschutz, Willkommens-E-Mail und Profil-Bearbeitung

### 24.1 AGB Seite
- [x] /agb Route erstellen
- [x] Rechtlicher Inhalt für AGB (KI2GO spezifisch, 10 Abschnitte)
- [x] Professionelles Layout mit Inhaltsverzeichnis
- [x] Kontaktdaten und Footer

### 24.2 Datenschutz Seite
- [x] /datenschutz Route erstellen
- [x] DSGVO-konformer Datenschutz-Text (10 Abschnitte)
- [x] Kontaktdaten für Datenschutzanfragen
- [x] Spezielle KI-Verarbeitung Sektion

### 24.3 Willkommens-Benachrichtigung
- [x] Benachrichtigung an Owner nach Profil-Vervollständigung
- [x] Personalisierte Begrüßung mit Name, E-Mail, Typ
- [x] Details: Firma, Position, Branche, Wie gefunden

### 24.4 Profil-Bearbeitung im Dashboard (/profile)
- [x] Profil-Seite mit 3 Tabs (Profil, Einstellungen, Datenschutz)
- [x] Alle Felder editierbar (außer E-Mail und Name)
- [x] Adress-Felder (Straße, PLZ, Stadt, Land)
- [x] DSGVO Datenexport Button
- [x] DSGVO Konto-Löschung beantragen
- [x] ROI-Einstellungen (Stundensatz)
- [x] Links zu AGB und Datenschutz


## Phase 25: Impressum Seite (ECG/Mediengesetz Österreich)

### 25.1 Impressum Seite erstellen
- [x] /impressum Route erstellen
- [x] Pflichtangaben nach ECG §5:
  - [x] Name/Firma des Diensteanbieters (Winitec GmbH)
  - [x] Geografische Anschrift (Siebenbrunnengasse 21, 1050 Wien)
  - [x] E-Mail-Adresse (office@ki2go.io)
  - [x] Firmenbuchnummer und Firmenbuchgericht
  - [x] Umsatzsteuer-Identifikationsnummer (UID)
  - [x] Geschäftsführung und Vertretungsbefugnis
- [x] Pflichtangaben nach Mediengesetz §25:
  - [x] Medieninhaber und Herausgeber
  - [x] Unternehmensgegenstand
  - [x] Blattlinie/Grundlegende Richtung
- [x] Zusätzliche Abschnitte:
  - [x] Streitbeilegung (OS-Plattform)
  - [x] Haftungsausschluss (Inhalte, Links, Urheberrecht)
  - [x] Bildnachweise
- [x] Professionelles Layout passend zu AGB/Datenschutz
- [x] Link im Footer der Startseite bereits vorhanden


## Phase 26: Cookie-Banner (DSGVO-Compliance)

### 26.1 Cookie-Consent Komponente
- [x] CookieConsentContext erstellt (globaler Zustand)
- [x] CookieBanner Komponente erstellt
- [x] Drei Optionen: Alle akzeptieren, Nur notwendige, Einstellungen
- [x] Cookie-Kategorien: Notwendig (immer aktiv), Analyse, Marketing
- [x] Consent in localStorage gespeichert
- [x] Moderne, nicht-aufdringliche UI mit Backdrop
- [x] Detaillierte Einstellungen mit Toggle-Switches

### 26.2 Integration
- [x] CookieConsentProvider in main.tsx eingebunden
- [x] CookieBanner in App.tsx eingebunden
- [x] Consent-Status global verfügbar (useCookieConsent Hook)
- [x] Link zu Datenschutz und Impressum im Banner


## Phase 27: Bug-Fixes Profil-Verwaltung

### 27.1 CompleteProfile Seite
- [x] Name-Feld hinzugefügt (editierbar, Pflichtfeld mit min. 2 Zeichen)
- [x] Checkboxen deutlich sichtbar (große Karten mit grünem Hintergrund bei Auswahl)
- [x] Bestätigungsfelder (AGB, Datenschutz) als klickbare Karten mit Check-Icon
- [x] Validierungs-Hinweis wenn Pflichtfelder fehlen
- [x] Backend: displayName Parameter zu completeProfile API hinzugefügt

### 27.2 Profile Seite (Bearbeitung)
- [x] Alle Felder editierbar (außer E-Mail)
- [x] Name editierbar
- [x] Firmenname editierbar (bei Business Pflicht, bei Privat "Privat")
- [x] User-Typ (Business/Privat) änderbar mit RadioGroup
- [x] Branche und "Wie gefunden" editierbar mit Select
- [x] Speichern und Abbrechen Buttons
- [x] Backend: updateProfile API erweitert für userType und howFound
- [x] Für alle Rollen: User, Admin, Owner


## Phase 28: Cookie-Einstellungen Link im Footer

### 28.1 Footer-Erweiterung
- [x] Cookie-Einstellungen Link im Footer hinzugefügt
- [x] Link öffnet das Cookie-Banner erneut (openSettings Funktion)
- [x] Cookie-Icon neben dem Link für bessere Erkennbarkeit


## Phase 29: SEO, Kontakt-Seite und Impressum-Aktualisierung

### 29.1 Meta-Tags aktualisieren
- [ ] Meta-Description mit Slogan "Ergebnisse statt chatten!" aktualisieren
- [ ] Open Graph Tags für Social Media Sharing
- [ ] Title Tag optimieren

### 29.2 Kontakt-Seite erstellen
- [ ] /kontakt Route erstellen
- [ ] Kontaktformular (Name, E-Mail, Betreff, Nachricht)
- [ ] Standort-Informationen (Adresse, Telefon, E-Mail)
- [ ] Google Maps Integration oder statische Karte
- [ ] Öffnungszeiten

### 29.3 Impressum-Daten aktualisieren
- [ ] Echte Firmenbuchnummer eintragen
- [ ] Echte UID-Nummer eintragen
- [ ] Alle Kontaktdaten prüfen


## Phase 30: Dashboard mit echten Daten

### 30.1 Backend-APIs
- [x] API dashboard.getStats - Echte Statistiken (Aufgaben heute, Ergebnisse, Zeitersparnis)
- [x] API dashboard.getRecentActivity - Letzte Workflow-Ausführungen des Users
- [x] API dashboard.getQuickActions - Aktive Templates für Schnellstart (aus DB)

### 30.2 Dashboard Frontend
- [x] Stats aus API laden (tasksToday, savedResults, timeSaved)
- [x] Letzte Aktivitäten aus workflowExecutions mit Status-Badges
- [x] Schnellstart dynamisch aus aktiven Templates (oder Empty State)
- [x] Loading States mit Skeletons
- [x] Empty States mit hilfreichen Hinweisen
- [x] Klickbare Aktivitäten mit Link zum Ergebnis


## Phase 31: Rollen-basierte Navigation und Dokumenten-Manager

### 31.1 Rollen-Konzept
**USER (normaler Benutzer):**
- [ ] Dashboard (persönliche Stats, letzte Aktivitäten)
- [ ] Neue Aufgabe (Aufgaben ausführen) → /aufgaben
- [ ] Meine Dokumente (Upload + Ergebnisse verwalten)
- [ ] Verlauf (eigene Ausführungen)
- [ ] Profil (eigene Daten)

**ADMIN (Firmen-Administrator):**
- [ ] Alles vom User PLUS:
- [ ] Firmen-Dashboard
- [ ] Firmen-Mitarbeiter
- [ ] Firmen-Statistiken

**OWNER (Plattform-Betreiber):**
- [ ] Alles PLUS:
- [ ] Admin-Dashboard (alle Firmen, alle User)
- [ ] Template-Verwaltung
- [ ] Kategorien & Geschäftsbereiche
- [ ] Kosten-Tracking & Analytics
- [ ] Prozess-Logs & Audit

### 31.2 Sidebar-Navigation nach Rollen
- [x] DashboardLayout.tsx komplett überarbeitet
- [x] USER Navigation: Dashboard, Neue Aufgabe, Meine Dokumente, Verlauf
- [x] ADMIN Navigation (Firma): Firmen-Dashboard, Mitarbeiter, Statistiken
- [x] OWNER Navigation (Plattform): Admin-Dashboard, Benutzer, Organisationen, Templates, Kategorien, Radar, Logs, Einstellungen
- [x] "Curated Tasks" und "Workflow" entfernt
- [x] Klare visuelle Trennung mit Abschnitts-Titeln

### 31.3 Dokumenten-Manager Backend
- [x] API documents.list - Alle Dokumente des Users (mit Filter, Suche, Sortierung)
- [x] API documents.getById - Einzelnes Dokument
- [x] API documents.delete - Dokument löschen
- [x] API documents.bulkDelete - Mehrere löschen
- [x] API documents.getStats - Speicherplatz-Info (Gesamt, Uploads, Ergebnisse)
- [x] API documents.updateDescription - Beschreibung ändern
- [x] API documents.listAll - Alle Dokumente (Owner)
- [x] API documents.getGlobalStats - Globale Statistiken (Owner)
- [x] ownerProcedure zu trpc.ts hinzugefügt

### 31.4 Dokumenten-Manager Frontend (/meine-dokumente)
- [x] Tabelle mit allen Dokumenten (responsive)
- [x] Filter: Upload vs Ergebnis (Tabs)
- [x] Sortierung: Datum, Name, Größe (Dropdown)
- [x] Suche nach Dateiname/Beschreibung
- [x] Bulk-Aktionen: Mehrfach löschen mit Checkboxen
- [x] Einzelaktionen: Download, Löschen (Dropdown-Menü)
- [x] Speicherplatz-Anzeige (4 Statistik-Karten)
- [x] Lösch-Bestätigung mit AlertDialog

### 31.5 Verlauf-Seite (/verlauf)
- [x] Liste aller Workflow-Ausführungen des Users
- [x] Status-Anzeige mit farbigen Badges (abgeschlossen, fehlgeschlagen, läuft, wartend)
- [x] Statistik-Karten (Gesamt, Erfolgreich, Fehlgeschlagen, Laufend)
- [x] Link zum Ergebnis bei abgeschlossenen Aufgaben
- [x] Filter nach Status (Dropdown)
- [x] Suche nach Aufgabenname
- [x] Dauer-Anzeige pro Aufgabe


## Phase 32: Dokument-Upload und Admin-Dashboard Erweiterung

### 32.1 Meine Dokumente: Upload-Funktionalität
- [ ] Upload-Button auf der Meine Dokumente Seite
- [ ] Drag & Drop Zone für Datei-Upload
- [ ] Upload-Fortschrittsanzeige
- [ ] Unterstützte Formate: PDF, DOCX, TXT, Bilder

### 32.2 Admin-Dashboard: Benutzer-Übersicht
- [ ] Übersicht aller registrierten Benutzer
- [ ] Letzte Aktivität pro Benutzer
- [ ] Anzahl Aufgaben-Ausführungen pro Benutzer
- [ ] Status (aktiv, gesperrt)

### 32.3 Admin-Dashboard: Aktivitäten-Feed
- [ ] Chronologische Liste aller Aktivitäten
- [ ] Filter nach Benutzer, Zeitraum
- [ ] Details: Wer hat was wann gemacht


## Phase 32: Dokument-Upload und Admin-Dashboard

### 32.1 Meine Dokumente: Upload-Funktionalität
- [x] Upload-API im Backend (documents.upload) mit S3 Integration
- [x] Drag & Drop Upload-Zone im Frontend
- [x] Datei-Validierung (PDF, Word, Excel, Bilder, max 50MB)
- [x] Upload-Progress-Anzeige mit Progress-Bar
- [x] Base64-Encoding für Datei-Transfer
- [x] Upload-Dialog mit Datei-Vorschau
- [x] Mehrere Dateien gleichzeitig hochladen

### 32.2 Admin-Dashboard: Benutzer-Übersicht
- [x] Neueste Benutzer anzeigen (letzte 5) mit Avatar und Rolle
- [x] Letzte Aktivitäten anzeigen (letzte 5) mit Status-Badges
- [x] Quick Stats erweitert (Benutzer, Aufgaben heute, Ergebnisse, Anfragen, Zeit gespart)
- [x] Links zu Detail-Seiten (Alle anzeigen)
- [x] Tabs für Kunden, Produktion, Qualität, Einstellungen (nur Owner sieht alle)


## Phase 33: Ergebnis-Viewer mit Dokumenten-Vergleich (Qualitätssicherung)

### 33.1 Ergebnis-Seite erweitern (/ergebnis/:id)
- [x] Split-View Layout: Dokument links, Ergebnis rechts (Resizable)
- [x] PDF-Viewer für hochgeladene Dokumente (iframe mit Google Docs Viewer)
- [x] Text-Anzeige für nicht-PDF Dokumente
- [x] Markdown-Rendering für Ergebnis (mit Streamdown)
- [x] Tabs für Ergebnis, Dokument, Protokoll
- [x] Metadaten: Template, Kosten, Dauer, Erstellt von
- [x] Backend: getExecution API erweitert mit Dokument-Daten

### 33.2 Verlauf-Seite erweitern (/verlauf)
- [x] "Ansehen" Button für abgeschlossene UND fehlgeschlagene Aufgaben
- [x] Unterschiedliche Button-Styles je nach Status
- [x] "Läuft..." Anzeige für laufende Aufgaben

### 33.3 Admin Qualitäts-Tab (/admin/ergebnisse)
- [x] Ergebnis-Übersicht für Owner/Admin erstellt
- [x] Alle Ergebnisse aller User mit Benutzer-Anzeige
- [x] Statistiken: Gesamt, Erfolgreich, Fehlgeschlagen, Zu prüfen
- [x] Filter nach Status und Suche nach Aufgabe/Benutzer
- [x] "Prüfen" Button öffnet Ergebnis-Viewer
- [x] In Admin-Dashboard unter Qualität-Tab verlinkt


## Phase 34: Test-Template und Bewertungsfunktion

### 34.1 Test-Template anlegen
- [x] Aktives Template "Vertrag prüfen" in DB erstellt (ID: 150101)
- [x] Variablen-Schema definiert (Vertragstyp, Dokument, Fokus, Rolle)
- [x] Superprompt für Vertragsanalyse erstellt
- [x] Template aktiviert und Featured gesetzt
- [x] Weitere aktive Templates: Vertrags Analyse (ID: 4), Bilanz Monat prüfen (ID: 150078)

### 34.2 Bewertungsfunktion im Ergebnis-Viewer
- [x] Daumen hoch/runter Buttons im Viewer (große klickbare Buttons mit Hover-Effekten)
- [x] Kommentarfeld für Feedback ("Kommentar zum Ergebnis")
- [x] Verbesserungsvorschläge Textfeld mit Placeholder-Beispielen
- [x] Bewertung in workflow_feedback speichern (inkl. comment Feld in DB)
- [x] Anzeige ob bereits bewertet (mit Zusammenfassung des Feedbacks)
- [x] Toast-Benachrichtigung nach Bewertung
- [x] Möglichkeit Rating zu ändern vor dem Absenden
- [x] "Nur Bewertung senden" und "Feedback senden" Buttons


## Phase 35: Home-Button und Impressum-Aktualisierung

### 35.1 Home-Button in Sidebar
- [x] Home-Button im Sidebar-Header hinzugefügt
- [x] "Startseite" als erster Menüpunkt in userNavItems hinzugefügt
- [x] Home-Button testen (Navigation zur Startseite)

### 35.2 Impressum aktualisieren
- [x] Firmendaten auf ProAgentur GmbH geändert
- [x] FN 632602y eingetragen
- [x] UID ATU81104118 eingetragen
- [x] Adresse: August Greimlweg 40, 1230 Wien
- [x] Unternehmensgegenstand: Werbe- und Handelsagentur
- [x] "KI2GO ist eine Entwicklung der ProAgentur GmbH" Hinweis hinzugefügt


## Phase 36: Autor- und Versionierungs-Pflichtfelder für Templates

### 36.1 Datenbank-Schema erweitern
- [x] createdByName Feld hinzugefügt (Pflicht - Name des Erstellers)
- [x] lastModifiedByName Feld hinzugefügt (Pflicht bei Änderungen)
- [x] templateVersion Feld hinzugefügt (z.B. 1.0, 1.1, 2.0)
- [x] changeLog Feld hinzugefügt (Beschreibung der Änderungen)
- [x] Migration durchgeführt (SQL ALTER TABLE)

### 36.2 Backend-Logik
- [x] create-Mutation: createdByName als Pflichtfeld
- [x] update-Mutation: lastModifiedByName als Pflichtfeld
- [x] Automatische Befüllung von templateVersion mit "1.0" bei Erstellung
- [x] Autor-Felder in list Query hinzugefügt

### 36.3 Admin-UI anpassen
- [x] Autor-Tracking Sektion im Template-Formular (Grunddaten-Tab)
- [x] Ersteller-Name Feld (Pflicht bei Erstellung, danach gesperrt)
- [x] Bearbeiter-Name Feld (Pflicht bei Änderung)
- [x] Version Feld mit Platzhalter-Beispielen
- [x] Änderungsprotokoll Feld
- [x] Autor-Spalte in Template-Tabelle hinzugefügt
- [x] Version-Anzeige in der Liste (v1.0, v1.1, etc.)


## Phase 37: ROI-Kalkulator für Superprompts

### 37.1 Datenbank-Schema erweitern
- [x] roiBaseTimeMinutes Feld hinzugefügt (Basis-Zeitaufwand manuell, Default: 30)
- [x] roiTimePerDocumentMinutes Feld hinzugefügt (Zeit pro Dokument, Default: 15)
- [x] roiKi2goTimeMinutes Feld hinzugefügt (KI2GO Zeit, Default: 3)
- [x] roiHourlyRate Feld hinzugefügt (Stundensatz, Default: 80€)
- [x] Felder in taskTemplates und customSuperprompts hinzugefügt

### 37.2 Backend-APIs anpassen
- [x] template.create mit ROI-Feldern erweitert
- [x] template.update mit ROI-Feldern erweitert
- [x] ROI-Felder in list Query hinzugefügt
- [ ] customSuperprompt.create mit ROI-Feldern erweitern (später)

### 37.3 ROI-Tab im Generator
- [x] Neuer Tab "ROI" im Superprompt-Generator
- [x] Editierbare Felder für alle ROI-Parameter
- [x] Live-Vorschau der Berechnung (1 Dokument, 3 Dokumente)
- [x] Monatliche Hochrechnung (10x Nutzung)
- [x] ROI-Felder werden beim Speichern übergeben

### 37.4 ROI-Sektion im Template-Editor
- [x] ROI-Tab im Template-Editor hinzugefügt (5 Tabs: Grunddaten, Variablen, Superprompt, ROI, Einstellungen)
- [x] Editierbare Felder für alle ROI-Parameter
- [x] Live-Vorschau der Berechnung (1 Dokument, 3 Dokumente)
- [x] ROI-Felder werden beim Erstellen und Aktualisieren gespeichert

### 37.5 Template-ID Anzeige korrigieren
- [x] uniqueId (SP-2026-XXX) in Template-Liste anzeigen
- [x] ID-Spalte als erste Spalte in der Tabelle hinzugefügt
- [x] Fallback auf #ID wenn uniqueId nicht vorhanden

### 37.6 ROI-Anzeige für Benutzer
- [x] Dynamische ROI-Berechnung auf Aufgaben-Seite (TaskExecution)
- [x] ROI basierend auf hochgeladenen Dokumenten berechnen
- [x] ROI-Banner mit Zeitersparnis und Geldersparnis
- [x] ROI-Felder in getBySlug Query hinzugefügt
- [x] ROI-Banner dynamisch basierend auf Dokumentenanzahl


## Phase 38: Inline-Validierung und UX-Optimierung

### 38.1 Inline-Validierung für CompleteProfile
- [x] Grüner Haken bei korrekter Eingabe (Name >= 2 Zeichen)
- [x] Grüner Haken bei Firmenname (wenn Business)
- [x] Visuelles Feedback während der Eingabe (touched-State)
- [x] Felder werden grün umrandet bei Erfolg
- [x] Fortschrittsanzeige (3 Punkte: Name, Firma, AGB)

### 38.2 AGB und Datenschutz kombinieren
- [x] Eine kombinierte Checkbox statt zwei separate
- [x] Text: "Ich akzeptiere die AGB und Datenschutzerklärung"
- [x] Links zu beiden Dokumenten im Text (klickbar, öffnen in neuem Tab)

### 38.3 Inline-Validierung für TaskExecution
- [x] Validierung für Pflicht-Variablen (touched-State)
- [x] Grüner Haken bei korrekter Eingabe
- [x] Gelbe Warnung bei fehlender Eingabe
- [x] Felder werden grün/gelb umrandet
- [x] Validierungs-Hinweis unter dem Feld


## Phase 39: Öffentliche Templates und Kunden-Zuweisung

### 39.1 Datenbank-Schema erweitern
- [x] isPublic Feld hinzugefügt (Template für alle User sichtbar)
- [x] Migration durchgeführt (ALTER TABLE)

### 39.2 Backend-Logik anpassen
- [x] getTemplateForExecution: Öffentliche Templates ohne Org-Prüfung
- [x] Template-Liste: isPublic Feld hinzugefügt
- [x] Zugriffsprüfung: isPublic OR Org-Freigabe OR Admin/Owner
- [x] create/update Mutations mit isPublic erweitert

### 39.3 Wahltaste 'Öffentlich' im UI
- [x] Generator: Checkbox "Öffentlich zugänglich" im Save-Dialog
- [x] Template-Editor: Dropdown "Öffentlich zugänglich" im Einstellungen-Tab
- [x] Anzeige in Template-Liste (Badge "Öffentlich" neben Status)

### 39.4 Direkte Organisations-Zuweisung
- [x] Dropdown für Organisation beim Speichern im Generator
- [x] Automatische Eintragung in organizationTemplates
- [x] Admin-Log für Zuweisung erstellen
- [ ] Optional: User-Zuweisung

### 39.5 Automatische Custom-Template-Kopie
- [ ] Bei erster Nutzung: Template als Custom kopieren
- [ ] User arbeitet dann mit seinem Custom Template
- [ ] Referenz zum Original behalten (für Updates)


## Phase 40: Bugfix Slug-Validierung und Metadaten-Anzeige

### 40.1 Slug-Validierung korrigiert
- [x] Regex-Pattern angepasst (Kleinbuchstaben, Zahlen, Unterstriche, Bindestriche)
- [x] Bessere Fehlermeldung hinzugefügt
- [x] Frontend-Slug-Generierung bereits korrekt (lowercase + replace)

### 40.2 Template-Metadaten-Anzeige
- [x] Erstellt von/am in Template-Tabelle (Autor-Spalte)
- [x] Zuletzt geändert von/am anzeigen (wenn unterschiedlich)
- [x] Versionsnummer und Datum in einer Zeile
- [ ] Custom Templates Metadaten (später)


## Phase 41: Custom Template ID, ROI-Banner, AGB-Update, Statistiken

### 41.1 Custom Template ID-Struktur
- [x] ID-Format: SP-2026-001-K42-V1 (Original-ID + Kunden-ID + Version)
- [x] Automatische Kopie als Custom Template bei erster Nutzung
- [x] Referenz zum Original-Template speichern (sourceTemplateUniqueId)
- [x] uniqueId und sourceTemplateUniqueId Spalten hinzugefügt

### 41.2 ROI-Banner auf Ergebnis-Seite
- [ ] "Sie haben X Minuten gespart" Banner
- [ ] Geldersparnis anzeigen
- [ ] Basierend auf Template-ROI-Werten und Dokumentenanzahl

### 41.3 AGB-Text aktualisieren
- [ ] Winitec GmbH → ProAgentur GmbH in AGB
- [ ] Alle rechtlichen Texte prüfen

### 41.4 Template-Statistiken pro Kunde
- [ ] Nutzungshäufigkeit pro Custom Template
- [ ] Durchschnittliche Bewertung
- [ ] Gesamte Zeitersparnis berechnen


## Phase 37: Vier neue Features (28.01.2026)

### 37.1 Custom Template ID-Struktur
- [x] Automatische Kopie beim Verwenden öffentlicher Templates
- [x] ID-Format: SP-YYYY-NNN-KXXX-V1 (Original-ID + Kunden-ID + Version)
- [x] Custom-Template wird automatisch bei erster Nutzung erstellt

### 37.2 ROI-Banner auf Ergebnis-Seite
- [x] "Sie haben X Minuten gespart" Banner nach Aufgaben-Abschluss
- [x] Dynamische Berechnung: Basis-Zeit + (Dokumente × Zeit pro Dokument) - KI2GO-Zeit
- [x] Geldersparnis-Anzeige basierend auf Stundensatz
- [x] Grüner Gradient-Banner mit Sparkles-Animation

### 37.3 AGB-Text aktualisieren (Winitec → ProAgentur)
- [x] AGB.tsx: Geltungsbereich aktualisiert
- [x] AGB.tsx: Kontaktbereich aktualisiert
- [x] AGB.tsx: Footer aktualisiert
- [x] Datenschutz.tsx: Verantwortlicher aktualisiert
- [x] Datenschutz.tsx: Kontaktbereich aktualisiert
- [x] Datenschutz.tsx: Footer aktualisiert
- [x] Kontakt.tsx: Adresse aktualisiert
- [x] Kontakt.tsx: Unternehmensdaten aktualisiert (FN 632602y, UID ATU81104118)
- [x] Kontakt.tsx: Kartenbereich aktualisiert (Liesing)
- [x] Kontakt.tsx: Footer aktualisiert
- [x] AdminCustomTemplates.tsx: Placeholder aktualisiert

### 37.4 Template-Statistiken pro Kunde
- [ ] Nutzungshäufigkeit pro Custom-Template anzeigen
- [ ] Durchschnittliche Bewertung pro Template
- [ ] Gesamte Zeitersparnis pro Template
- [ ] Statistik-Dashboard für Kunden


## Phase 38: Marketing-Tab für Templates (SEO & ROI-Integration)

### 38.1 Datenbank-Schema
- [x] Marketing-Felder zu taskTemplates hinzugefügt:
  - marketingHeadline (SEO-optimiert, max 60 Zeichen)
  - marketingSubheadline (Nutzenversprechen)
  - marketingUsps (JSON Array mit 3-4 USP-Punkten)
  - marketingCtaText (Call-to-Action)
  - marketingEnabled (Boolean - Banner anzeigen ja/nein)
  - marketingMetaDescription (SEO Meta-Description)
  - marketingKeywords (SEO Keywords)

### 38.2 Backend-API
- [x] template.generateMarketing - KI generiert Marketing-Texte basierend auf Template-Beschreibung
- [x] template.updateMarketing - Marketing-Felder speichern
- [x] Marketing-Felder in workflow.getTemplateForExecution integriert

### 38.3 Template-Editor UI
- [x] Neuer Tab "Marketing" neben ROI (6 Tabs insgesamt)
- [x] KI-Generierung Button "Mit KI generieren" mit Loading-State
- [x] Editierbare Felder für alle Marketing-Texte
- [x] Toggle für "Marketing-Banner anzeigen" (Dropdown)
- [x] Live-Vorschau des Marketing-Banners mit ROI-Daten
- [x] USP-Punkte als Tags mit Add/Remove Funktionalität
- [x] SEO-Keywords als Tags mit Add/Remove Funktionalität
- [x] Google-Suchergebnis Vorschau

### 38.4 Aufgaben-Seite (User)
- [x] Marketing-Banner ganz oben auf der Aufgaben-Seite (wenn aktiviert)
- [x] ROI-Daten automatisch aus Template laden und anzeigen
- [x] Dynamische ROI-Berechnung (Zeitersparnis + Geldersparnis)
- [x] Professionelles Design mit grünem Gradient und Icons
- [x] USP-Punkte mit CheckCircle Icons

### 38.5 SEO-Optimierung
- [x] Meta-Tags automatisch aus Marketing-Feldern generieren (PageHeader erweitert)
- [x] Dynamischer Title-Tag mit Template-Headline
- [x] Meta-Description aus marketingMetaDescription
- [x] Meta-Keywords aus marketingKeywords
- [x] Canonical URL für jede Aufgaben-Seite
- [ ] Open Graph Tags für Social Media (später)
- [ ] Strukturierte Daten (Schema.org) für Google (später)


## Phase 39: Marketing-Tab Bugfixes (29.01.2026)

### 39.1 Layout-Problem beheben
- [x] Tabs überlappen sich - responsive Design verbessert (flex-wrap statt grid)
- [x] 6 Tabs auf kleineren Bildschirmen besser dargestellt (kleinere Schrift, flexibles Wrapping)

### 39.2 Speichern-Funktion reparieren
- [x] Marketing-Felder werden jetzt beim Speichern übernommen
- [x] handleUpdate Funktion mit Marketing-Feldern erweitert
- [x] template.update Backend-API mit Marketing-Feldern erweitert


## Phase 40: Template-Speicherung Bug (29.01.2026)

### 40.1 Bug: Änderungen werden nicht gespeichert
- [x] Template SP-2026-004 Änderungen werden nicht übernommen
- [x] Prüfe Browser-Console auf Fehler
- [x] Prüfe Backend-Logs auf Fehler
- [x] Identifiziere und behebe den Bug
- [x] Problem: lastModifiedByName war leer wenn Template keine vorherige Änderung hatte
- [x] Lösung: Setze lastModifiedByName automatisch auf aktuellen User beim Öffnen des Edit-Dialogs


## Phase 41: Slug-Validierung Bug (29.01.2026)

### 41.1 Bug: Slug mit Großbuchstaben wird abgelehnt
- [x] SP-2026-004 hat Großbuchstaben im Slug
- [x] Backend-Validierung erlaubt nur Kleinbuchstaben
- [x] Anpassen der Regex um auch Großbuchstaben zu erlauben
- [x] template.create Validierung angepasst: /^[a-zA-Z][a-zA-Z0-9_-]*$/
- [x] template.update Validierung angepasst: /^[a-zA-Z][a-zA-Z0-9_-]*$/
- [x] Frontend Slug-Input: Keine automatische Kleinschreibung mehr


## Phase 42: Feature-System & Kunden-Dashboard (29.01.2026)

### 42.1 Datenbank-Schema
- [x] plans Tabelle (id, slug, name, limits JSON, features JSON)
- [x] userSubscriptions Tabelle (userId, planId, status, validUntil)
- [x] usageTracking Tabelle (userId, month, tasksUsed, storageUsed)
- [x] templateCategories Tabelle (für Kunden-Kategorisierung)
- [x] templateCategoryAssignments Tabelle (Template-Kategorie Zuordnung)
- [x] templateMemberAssignments Tabelle (für Mitarbeiter-Zuweisung)

### 42.2 Backend: Feature-Check Helpers (server/planFeatures.ts)
- [x] checkFeature(userId, featureKey) - Prüft ob Feature im Plan enthalten
- [x] checkLimit(userId, limitKey) - Prüft ob Limit erreicht
- [x] incrementUsage(userId, type) - Erhöht Usage-Counter
- [x] getUserPlan(userId) - Lädt aktuellen Plan mit Features

### 42.3 Backend: Kunden-Template API (server/routers/myTemplates.ts)
- [x] myTemplates.getAll - Alle Custom-Templates des Users
- [x] myTemplates.getCategories - Eigene Kategorien laden
- [x] myTemplates.createCategory - Neue Kategorie erstellen
- [x] myTemplates.assignToCategory - Template einer Kategorie zuordnen
- [x] myTemplates.removeFromCategory - Template aus Kategorie entfernen
- [x] myTemplates.assignToMember - Template an Mitarbeiter freigeben
- [x] myTemplates.removeFromMember - Freigabe entfernen
- [x] myTemplates.getAvailableMembers - Verfügbare Mitarbeiter laden
- [x] myTemplates.getPlanInfo - Plan-Info und Limits laden

### 42.4 Frontend: Kunden-Dashboard (client/src/pages/MeineTemplates.tsx)
- [x] Neue Seite /meine-templates
- [x] Statistik-Karten (Templates, Kategorien, Nutzungen, Verbleibend)
- [x] Kategorien-Sidebar mit Farbauswahl
- [x] Template-Grid mit Karten und Aktionen
- [x] Kategorie-Erstellung Dialog
- [x] Kategorie-Zuweisung Dialog
- [x] Mitarbeiter-Freigabe Dialog (nur Business Plan)
- [x] Plan-Badge und Upgrade-Hinweis
- [x] Navigation: "Meine Templates" in DashboardLayout hinzugefügt

### 42.5 Bug-Fix: Basis-Template Anzeige
- [x] sourceTemplateUniqueId in customSuperprompt.getAll laden
- [x] Fallback auf sourceTemplateUniqueId wenn baseTemplateName nicht gefunden


## Phase 43: Ergebnis-Seite Verbesserungen (29.01.2026)

### 43.1 Bugs auf## Phase 43: Ergebnis-Seite Bugfixes

### 43.1 Dokument-Anzeige im Split-Screen
- [x] Eingabe-Dokument zeigt "Kein Dokument vorhanden" obwohl Dokument hochgeladen wurde
- [x] documentIds werden jetzt direkt aus der Execution geladen (nicht nur aus variableValues)
- [x] Fallback auf variableValues wenn documentIds leer

### 43.2 Scroll-Funktion
- [x] Ergebnis-Bereich hat jetzt Scroll-Funktion bei langem Inhalt
- [x] Panel-Höhe dynamisch: h-[calc(100vh-300px)] min-h-[500px] max-h-[800px]

### 43.3 PDF-Download
- [x] PDF-Export Button hinzugefügt (prominent in Primary-Farbe)
- [x] export.exportPdf Query im Backend implementiert
- [x] PDF wird über Browser-Druckdialog generiert ("Als PDF speichern")

## Phase 44: PDF-Export Layout Verbesserung

### 44.1 Probleme
- [x] PDF-Layout ist sehr schlecht bei Vertragsanalyse
- [x] Keine Tabellen werden dargestellt
- [x] Formatierungen fehlen komplett
- [x] Professionelles Layout mit Kopfzeile, Tabellen und Styling implementiert

### 44.2 Implementierte Verbesserungen
- [x] Vollständige Markdown-zu-HTML Konvertierung mit Tabellen-Support
- [x] Professionelles Header-Design mit KI2GO Logo und Titel
- [x] Meta-Info Box mit Erstellungsdatum und Status
- [x] Tabellen mit farbigen Headers und Zebra-Streifen
- [x] Status-Badges für OK/Warnung/Fehler in Tabellen
- [x] Unterstützung für Überschriften (h1-h4)
- [x] Listen (nummeriert und Aufzählung)
- [x] Code-Blöcke und Inline-Code
- [x] Blockquotes und horizontale Linien
- [x] Professioneller Footer mit Branding
- [x] Print-optimierte CSS Styles


## Phase 45: Kundenraum-Branding und Firmen-Admin Dashboard

### 45.1 Kundenraum - Branding
- [x] Logo-Feld für Organizations in Datenbank (logoUrl bereits vorhanden)
- [x] Logo-Upload API implementieren (organization.updateLogo)
- [x] Kundenraum-Info API implementieren (organization.getKundenraumInfo)
- [x] KundenraumHeader Komponente erstellt mit:
  - [x] Firmenlogo + Firmenname prominent angezeigt
  - [x] "Kundenraum der [Firmenname]" Titel
  - [x] Logo-Upload per Hover-Overlay
  - [x] Plan-Badge (Free/Starter/Business/Enterprise)
  - [x] Aufgaben-Nutzung Fortschrittsbalken
  - [x] Speicher-Nutzung Fortschrittsbalken

### 45.2 Kundenraum - Neue Aufgaben entdecken
- [x] API: myTemplates.getDiscoverableTemplates - Öffentliche Templates die noch nicht verwendet wurden
- [x] API: myTemplates.getKundenraumStats - Statistiken für Kundenraum
- [x] DiscoverTemplates Komponente erstellt mit:
  - [x] "Neue Aufgaben entdecken" Titel mit Sparkles-Icon
  - [x] Template-Karten mit NEU-Badge
  - [x] "Ausprobieren" Button
  - [x] Zeit-Ersparnis Anzeige
  - [x] Farbige Top-Border basierend auf Template-Farbe
- [x] Integration in /meine-templates Seite

### 45.3 Firmen-Admin - Nutzungs-Dashboard/Radar
- [ ] API: Nutzungs-Statistiken pro Mitarbeiter laden
- [ ] Dashboard-Seite /firma/dashboard erstellen
- [ ] KPI-Karten (Gesamtnutzung, Top-Templates, Kosten)
- [ ] Mitarbeiter-Tabelle mit Nutzungszahlen
- [ ] Trend-Grafiken (letzte 30 Tage)
- [ ] Export als CSV/Excel


## Phase 46: Firmen-Admin Dashboard, Default-Pläne und Verbrauchs-Tracking

### 46.1 Default-Pläne in Datenbank
- [x] Seed-Script für Default-Pläne erstellen (Free, Starter, Business, Enterprise)
- [x] Alle Pläne auf Preis 0 setzen (Preise später definierbar)
- [x] Konkrete Limits pro Plan definieren (Tasks, Templates, Storage, Users)
- [x] Feature-Flags pro Plan definieren (template_sharing, monitoring, masking, priority)

### 46.2 Verbrauchs-Tracking erweitern
- [x] usageTracking Tabelle um Manus-Kosten erweitern (inputTokens, outputTokens, totalCost)
- [x] Kosten pro Aufgaben-Ausführung tracken (incrementTokenUsage in workflow.execute)
- [x] API: Verbrauch pro Kunde abrufen (ownerDashboard.getKundenKosten)
- [x] API: Gesamtverbrauch aller Kunden (ownerDashboard.getAllUsersNutzung)
- [x] API: Manus-Kosten Übersicht (ownerDashboard.getManusKosten)

### 46.3 Feature-Gates aktivieren
- [x] checkLimit in workflow.execute einbauen (Tasks pro Monat)
- [ ] checkLimit bei Template-Erstellung einbauen (Custom Templates) - später
- [ ] checkLimit bei Dokument-Upload einbauen (Storage) - später
- [ ] checkFeature bei Template-Sharing einbauen - später
- [x] Upgrade-Hinweis bei Limit-Überschreitung anzeigen (TRPCError FORBIDDEN)

### 46.4 Firmen-Admin Dashboard Backend
- [x] API: Nutzungs-Statistiken pro Mitarbeiter laden (firmaDashboard.getMemberStats)
- [x] API: KPI-Daten (firmaDashboard.getKpis)
- [x] API: Trend-Daten (firmaDashboard.getTrends)
- [x] API: Mitarbeiter-Aktivität (aktiv/inaktiv, letzte Nutzung)

### 46.5 Firmen-Admin Dashboard Frontend
- [x] Dashboard-Seite /firma/nutzung erstellen (FirmaDashboard.tsx)
- [x] KPI-Karten (Gesamtnutzung, Tokens, Kosten, Mitarbeiter)
- [x] Mitarbeiter-Tabelle mit Nutzungszahlen und Status
- [x] Trend-Grafiken (letzte 6 Monate)
- [x] Export als CSV

### 46.6 Owner Dashboard - Manus-Kosten
- [x] Kosten-Übersicht pro Kunde im Owner-Dashboard (/admin/manus-kosten)
- [x] Gesamtkosten bei Manus anzeigen
- [x] Kosten-Trend über Zeit (12 Monate)
- [x] Navigation in DashboardLayout erweitert


## Phase 47: Zwei Nutzungsebenen - Kostenlos vs. Datenraum

### 47.1 Fix execute - Öffentliche Templates für alle
- [x] execute Mutation: isPublic Templates für alle eingeloggten User erlauben
- [x] Gleiche Logik wie getTemplateForExecution verwenden

### 47.2 Template-Kopier-Workflow
- [x] API: copyTemplateToKundenraum - Kopiert öffentliches Template in organizationTemplates
- [x] API: hasKundenraum - Prüft ob User einen Datenraum hat
- [x] API: getKundenraumTemplates - Lädt Templates im Kundenraum
- [x] API: removeFromKundenraum - Entfernt Template aus Kundenraum
- [x] Prüfung: Nur wenn User einen Datenraum (organizationId) hat
- [x] Verhindere Duplikate: Template kann nur einmal kopiert werden

### 47.3 Neue Aufgaben entdecken erweitern
- [x] "Hinzufügen" Button statt "Ausprobieren" für Datenraum-Kunden
- [x] Unterscheidung: User ohne Datenraum → direkt ausführen, mit Datenraum → kopieren
- [x] Erfolgsmeldung nach Kopieren
- [x] "Hinzugefügt" Status nach erfolgreichem Kopieren

### 47.4 Anpassungswunsch für Kunden
- [x] API: requestTemplateCustomization - Anpassungswunsch einreichen
- [x] API: getMyCustomizationRequests - Eigene Anpassungswünsche laden
- [x] Speichern als TaskRequest mit complexity="custom"
- [ ] Frontend: Button "Anpassung anfragen" bei kopierten Templates (später)
- [ ] Benachrichtigung an Owner (TODO im Code)

### 47.5 Custom Superprompt Owner-only
- [x] Prüfen ob Custom Superprompt bereits Owner-only ist - JA, ist bereits so!
- [x] Alle Mutations (create, update, toggleActive, delete) prüfen ctx.user.role !== "owner"
- [x] Kunden können NICHT selbst Custom Superprompts erstellen/bearbeiten


## Phase 48: Kritische Testphasen-Vorbereitung

### 48.1 Plan-Limits anpassen
- [x] Free-Plan deaktivieren (isDefault=false, isActive=false)
- [x] Starter als Default setzen (isDefault=true)
- [x] Starter: taskLimit=100, teamMemberLimit=5, Masking-Feature hinzugefügt
- [x] Business: teamMemberLimit=20, Masking-Feature hinzugefügt
- [ ] trialDays-Feld zu plans-Tabelle hinzufügen (später)

### 48.2 Automatische Organization bei Registrierung
- [x] Bei Profil-Vervollständigung automatisch Organization erstellen (completeProfile)
- [x] User als Owner der neuen Organization setzen
- [x] organizationId in User-Tabelle setzen
- [x] organizationMembers-Eintrag erstellen

### 48.3 Testphasen-Logik (Trial mit Ablaufdatum)
- [x] Bei Registrierung automatisch Starter-Plan mit status="trial" zuweisen (in completeProfile)
- [x] validUntil auf +14 Tage setzen
- [ ] Trial-Status in UI anzeigen (Tage verbleibend) - später
- [ ] Admin kann Trial verlängern (validUntil anpassen) - später



## Phase 49: Kundenraum-Branding & Template-Editor Verbesserung

### 49.1 Firmenlogo/Firmenname im Header
- [x] Dashboard-Header: KI2GO Logo durch Firmenlogo ersetzen (wenn vorhanden)
- [x] Header-Text: "[Firmenname] - Kundenraum" statt "KI2GO"
- [x] Fallback: KI2GO Logo wenn kein Firmenlogo vorhanden

### 49.2 Template-Editor grundlegend verbessern
- [x] Besseres Layout und Bedienbarkeit (Gruppierte Sektionen mit Karten)
- [x] Größere Eingabefelder (h-10 für Inputs)
- [x] Klarere Struktur der Tabs (flex-wrap, Icons, whitespace-nowrap)
- [x] Autor-Tracking kompakt in einer Zeile (4 Spalten statt 2x2)


## Phase 50: Template-Editor Tabs Fix (29.01.2026)

### 50.1 Tabs überlappen sich noch immer
- [x] Problem: Änderungen wurden nicht korrekt angewendet
- [x] Tabs mit Underline-Style statt Pills (border-b-2)
- [x] Inline-flex mit gap-2 für klare Trennung
- [x] Kürzere Labels (Prompt statt Superprompt, Optionen statt Einstellungen)


## Phase 51: Einheitliches Tab-Design für alle Admin-Dialoge (29.01.2026)

### 51.1 Gefundene Dialoge mit Tabs
- [x] AdminGenerator.tsx - Tabs für Generator/Import/Ergebnis/Variablen/ROI
- [x] AdminMetaprompts.tsx - Tabs für Manuell/Import
- [x] AdminUsers.tsx - Tabs für Profil/Einstellungen/Gefahrenzone
- [x] Admin.tsx - Hauptnavigation Tabs (Kunden/Produktion/Qualität/Einstellungen)


## Phase 52: Kundenraum-Branding auf Homepage (29.01.2026)

### 52.1 Personalisierte Willkommensnachricht
- [x] Hero-Bereich: KI2GO Logo durch "Willkommen im KI Dataroom von [Firmenname]" ersetzen
- [x] Nur für eingeloggte Kunden mit Datenraum anzeigen
- [x] Fallback: Standard KI2GO Branding für Besucher ohne Datenraum


## Phase 53: Dateivorschau-Funktion (29.01.2026)

### 53.1 Dateivorschau-Komponente
- [x] FilePreview Komponente erstellen
- [x] PDF-Vorschau mit eingebettetem Viewer
- [x] Bild-Vorschau (JPG, PNG, GIF, WebP) mit Zoom/Rotation
- [x] Text-Vorschau für TXT, MD, JSON
- [x] Fallback für nicht unterstützte Dateitypen

### 53.2 Integration in bestehende Ansichten
- [x] Vorschau-Button in MeineDokumente.tsx hinzugefügt
- [x] Vorschau-Button in AdminDocuments.tsx hinzugefügt
- [x] Modal-Dialog für Vorschau mit Zoom/Rotation für Bilder
- [x] Download-Button in Vorschau-Modal


## Phase 54: Neues Template-System (Owner-Templates & Custom-Templates) (29.01.2026)

### 54.1 Terminologie-Definition
- [x] Superprompts = Internes Rohmaterial
- [x] Owner-Templates (OT) = Aus Superprompts generiert, KI2GO Know-How
- [x] Custom-Templates (CT) = Kundenspezifische Kopien von Owner-Templates

### 54.2 Nummerierung & Migration
- [x] Owner-Templates: OT-[fortlaufend]-V[Version] (z.B. OT-042-V3)
- [x] Custom-Templates: CT-[OT-Nr]-K[Jahr]-[KundenNr]-V[Version] (z.B. CT-042-K2026-015-V2)
- [x] Kundennummer: K[Jahr]-[fortlaufend] (z.B. K2026-001)
- [x] Migration: SP-XXX zu OT-XXX umgewandelt
- [x] Migration: Custom-Templates auf CT-Format umgestellt
- [x] organizations.customerNumber Feld hinzugefügt

### 54.3 Datenbank-Schema
- [x] organizations.customerNumber Feld hinzugefügt (K2026-XXX Format)
- [x] taskTemplates.uniqueId Kommentar aktualisiert für OT-Format
- [x] customSuperprompts.status Feld hinzugefügt (active, paused, archived, change_requested)
- [x] Neue Tabelle: templateChangeRequests für Änderungsanfragen erstellt

### 54.4 Backend-APIs
- [x] getExtendedStats - Erweiterte Statistiken mit Gruppierung nach Firma/Template
- [x] getAllWithDetails - Custom-Templates mit Filter, Sortierung, Pagination
- [x] assignToOrganization - Kundenzuweisung mit neuer CT-Nummer
- [x] updateStatus - Status ändern (aktiv, pausiert, archiviert)
- [x] getUsageStats - Nutzungsstatistik pro Template
- [x] getOrganizationsForAssignment - Dropdown für Kundenzuweisung
- [x] getOwnerTemplatesForFilter - Dropdown für Filter
- [ ] submitChangeRequest - Änderungsanfrage einreichen (Phase 5)
- [ ] processChangeRequest - Anfrage bearbeiten (Phase 5)

### 54.5 Admin Owner-Templates Verwaltung
- [ ] Übersicht aller Owner-Templates mit Statistik
- [ ] Sortierung nach allen Spalten
- [ ] Filter nach Kategorie, Unternehmensbereich
- [ ] Versionierung anzeigen
- [ ] Bearbeitungsdialog

### 54.6 Admin Custom-Templates Verwaltung
- [x] Übersicht aller Custom-Templates mit Kundenzuweisung
- [x] Filter nach Firma, Owner-Template, Status
- [x] Sortierung nach allen Spalten (Template-ID, Name, Nutzungen, Letzte Nutzung, Firma)
- [x] Nutzungsstatistik pro Template und nach Firma
- [ ] Changelog/Versionshistorie (später)
- [x] Kundenzuweisung bearbeiten mit automatischer ID-Aktualisierung

### 54.7 Änderungsanfrage-System
- [x] Kunde kann Änderung anfragen (submitChangeRequest API)
- [x] Admin sieht alle offenen Anfragen (getChangeRequests API)
- [x] Status: Offen → In Bearbeitung → Umgesetzt/Abgelehnt (processChangeRequest API)
- [x] Bei revolutionärer Idee: Owner-Template verbessern (updateOwnerTemplate Flag)
- [x] Bei individueller Idee: Nur Custom-Template ändern
- [x] Kunde sieht eigene Anfragen (getMyChangeRequests API)

#### 54.8 Kunden-Dashboard
- [x] Custom-Templates mit CT-Nummer (uniqueId) anzeigen
- [x] Status-Badge anzeigen (Aktiv/Pausiert/Änderung angefragt/Archiviert)
- [x] Status-Feld zur myTemplates.getAll API hinzugefügt
- [ ] Änderungsanfrage stellen (UI noch ausstehend)
- [ ] Eigene Anfragen einsehen (UI noch ausstehend)
- [ ] Nutzungsstatistik

### 54.9 Migration
- [ ] Bestehende Templates auf neue Nummerierung migrieren
- [ ] customTemplates mit organizationId verknüpfen
- [ ] Kundennummern generieren (K2026-XXX)


## Phase 55: Änderungsanfrage-UI und Owner-Templates Umbenennung

### 55.1 Änderungsanfrage-UI für Kunden
- [x] Button "Änderung anfragen" in MeineTemplates Template-Karten
- [x] Dialog mit Formular: Titel, Beschreibung der gewünschten Änderung
- [x] Priorität auswählen (niedrig, normal, hoch, dringend)
- [x] Bestätigung nach Absenden (Toast)
- [x] Eigene Anfragen einsehen (Dialog mit Liste und Status)

### 55.2 Admin-Änderungsanfragen-Dashboard
- [x] Neue Seite /admin/change-requests erstellt
- [x] Übersicht aller offenen Anfragen mit Statistik-Karten
- [x] Filter nach Status (Offen, In Bearbeitung, Abgeschlossen)
- [x] Suche nach Titel, Beschreibung, User, Firma
- [x] Bearbeitungs-Workflow: Status ändern, Notizen hinzufügen
- [ ] Antwort an Kunden senden (später)
- [x] Option: Owner-Template verbessern (Checkbox im Dialog)

### 55.3 Owner-Templates Umbenennung
- [x] /admin/templates Seite auf "Owner-Templates" umbenennen
- [x] OT-Nummern in der Tabelle anzeigen (Spalte "OT-Nummer")
- [x] Navigation/Sidebar aktualisiert
- [x] Admin.tsx Karte auf "Owner-Templates" geändert


## Phase 56: Universeller Template-Editor

### 56.1 Datenbank erweitern
- [x] customSuperprompts: title, shortDescription hinzugefügt
- [x] customSuperprompts: categoryId, businessAreaId hinzugefügt
- [x] customSuperprompts: icon, color hinzugefügt
- [x] customSuperprompts: variableSchema (JSON) hinzugefügt
- [x] customSuperprompts: ROI-Felder (estimatedTimeSavings, creditCost, etc.)
- [x] customSuperprompts: Marketing-Felder (marketingEnabled, marketingHeadline, etc.)
- [x] customSuperprompts: Dokument-Einstellungen (documentRequired, allowedFileTypes, etc.)
- [x] customSuperprompts: Autor-Tracking (createdByName, lastModifiedByName, templateVersion, changeLog)

### 56.2 Backend APIs erweitern
- [x] updateFull: Alle Felder aktualisierbar machen (customSuperprompt.ts)
- [x] getForEdit: Alle Felder laden inkl. Kategorie, Bereich, Organisation
- [ ] Kopier-Logik: Alle Felder vom Owner-Template übernehmen

### 56.3 Universelle TemplateEditor-Komponente
- [x] Komponente erstellt (client/src/components/TemplateEditor.tsx)
- [x] Parameter mode="owner" oder mode="custom"
- [x] Alle Tabs: Grunddaten, Variablen, Superprompt, ROI, Marketing, Einstellungen
- [x] Bei Custom: CT-Nummer + Kunde + Basis-Template anzeigen
- [x] Bei Owner: OT-Nummer anzeigen

### 56.4 Integration
- [x] AdminCustomTemplates mit neuem Editor integrieren (Settings-Button)
- [ ] AdminTemplates (Owner) mit gleicher Komponente
- [ ] Einheitliches Styling und Verhalten

### 56.5 Tests
- [x] customSuperprompt.updateFull.test.ts erstellt (6 Tests)
- [x] Alle 153 Tests bestanden


## Bugfix: Alter Edit-Dialog ersetzen
- [x] Alten Edit-Dialog (Stift-Button) durch neuen TemplateEditor ersetzen
- [x] Nur noch einen Bearbeiten-Button anzeigen (nicht zwei verschiedene)


## Phase 57: TemplateEditor 100% Abgleich mit Owner-Template
- [x] ROI-Tab: Dokument-Skalierung mit 1-Dokument und 3-Dokumente Vorschau
- [x] ROI-Tab: Beschreibungstexte für alle Felder hinzugefügt
- [x] Marketing-Tab: USPs-Liste mit Add/Remove
- [x] Marketing-Tab: Keywords-Liste mit Add/Remove
- [x] Marketing-Tab: Google-Suchergebnis Vorschau
- [x] Marketing-Tab: Zeichenzähler für Headline/Subheadline/Meta
- [x] Alle 153 Tests bestanden


## Bug: Marketing-Daten werden nicht gespeichert (Owner-Templates)
- [x] Backend template.update API geprüft - Update-Mutation war korrekt
- [x] Marketing-Felder zur template.list Query hinzugefügt (fehlten dort!)


## Phase 58: Öffentliche Aufgaben-Vorschau-Seite
- [x] Backend API template.getPublicPreview (publicProcedure)
- [x] Frontend TaskPreview.tsx mit ROI-Kalkulation
- [x] Marketing-USPs als Bullet-Points
- [x] Beispiel-Output Vorschau (exampleOutput Feld)
- [x] Variablen-Vorschau (nur Labels, keine Details)
- [x] 14-Tage-Test CTA Button mit Test-Vorteilen
- [x] Route /aufgabe/:slug leitet zu /vorschau wenn nicht eingeloggt
- [x] Alle 153 Tests bestanden


## Phase 59: ROI-Disclaimer einbauen
- [x] Disclaimer in TaskPreview.tsx (öffentliche Vorschau) - ausführlicher Text
- [x] Disclaimer in TaskExecution.tsx - kurzer Hinweis bei beiden ROI-Bannern
- [x] Disclaimer in TemplateEditor.tsx - Admin-Hinweis im ROI-Tab


## Phase 60: Erweiterte ROI-Berechnung mit Magic Button
- [x] DB-Schema: roiKi2goTimePerDocument Feld hinzugefügt
- [x] Backend: template.update und customSuperprompt.updateFull erweitert
- [x] ROI-Tab: Slider für 1-10 Dokumente mit Live-Berechnung
- [x] ROI-Tab: Balkendiagramm Manuell vs. KI2GO
- [x] ROI-Tab: Jahresersparnis "Bei X Aufgaben/Monat: €Y/Jahr"
- [x] Magic ROI Button: KI analysiert Superprompt und schlägt Werte vor
- [x] Frontend Vorschau: Erweiterte ROI-Anzeige mit Jahresersparnis
- [x] Frontend Ausführung: Jahresersparnis prominent (lila Box)
- [x] Alle Werte bleiben manuell editierbar
- [x] Alle 153 Tests bestanden


## Phase 61: Owner-Templates Editor auf universellen TemplateEditor umstellen
- [x] AdminTemplates.tsx: Alten Edit-Dialog durch TemplateEditor ersetzt
- [x] TemplateEditor für mode="owner" integriert
- [x] Alten Editor-Code entfernt (renderEditorTabs bleibt für Create-Dialog)
- [x] Alle 153 Tests bestanden
- [x] Beide Editoren (Owner + Custom) sind jetzt identisch


## Phase 62: TemplateEditor vereinheitlichen (Create + Edit)
- [x] TemplateEditor um isCreate Flag erweitert
- [x] AdminTemplates.tsx Create-Dialog auf TemplateEditor umgestellt
- [x] AdminCustomTemplates.tsx - Create-Dialog bleibt (spezieller Kopier-Flow für Kunden)
- [x] AdminCustomTemplates.tsx - Edit-Dialog verwendet bereits TemplateEditor
- [x] Beide Editoren (Owner + Custom) sind jetzt 100% identisch
- [x] Alle 153 Tests bestanden


## Bug: Dokument-Anzahl wird im Frontend nicht korrekt angezeigt
- [x] Datenbank geprüft - documentCount war tatsächlich 10 in der DB
- [x] Wert manuell auf 5 korrigiert (ID 4: vertrags_analyse)
- [x] Frontend verwendet korrekt template.documentCount


## Feature: Dropdown-Optionen im Variablen-Editor bearbeiten
- [x] Variablen-Editor analysiert (TemplateEditor.tsx)
- [x] Bei Dropdown-Typ (select/multiselect) Optionen-Editor angezeigt
- [x] Optionen hinzufügen, bearbeiten und löschen möglich
- [x] Gilt für Owner-Templates und Custom-Templates
- [x] Alle 153 Tests bestanden


## Feature: Dropdown-Optionen im Variablen-Editor bearbeiten
- [x] Variablen-Editor analysiert (TemplateEditor.tsx)
- [x] Bei Dropdown-Typ (select/multiselect) Optionen-Editor angezeigt
- [x] Optionen hinzufügen, bearbeiten und löschen möglich
- [x] Gilt für Owner-Templates und Custom-Templates
- [x] Alle 153 Tests bestanden


## Bug: documentCount wird nicht gespeichert
- [ ] Analysieren warum documentCount nicht in DB gespeichert wird
- [ ] Bug beheben


## Bugfixes (30.01.2026)
- [x] BUG: ROI-Berechnung zeigte hardcodierte "10 Aufgaben/Monat" statt konfigurierbarem Wert
  - Neues DB-Feld `roiTasksPerMonth` zu taskTemplates und customSuperprompts hinzugefügt
  - Backend APIs erweitert (template.create, template.update, template.list, template.getBySlug, template.getPublicPreview, workflow.getTemplateForExecution, customSuperprompt.updateFull)
  - TemplateEditor: Slider speichert jetzt in formData.roiTasksPerMonth (wird mit Template gespeichert)
  - TaskPreview.tsx: Verwendet jetzt template.roi.tasksPerMonth
  - TaskExecution.tsx: Verwendet jetzt template.roiTasksPerMonth


## Phase 20: Interaktiver ROI-Rechner mit Quellenangaben

### 20.1 Datenbank
- [ ] Neues Feld `roiSources` (JSON Array) zu taskTemplates hinzufügen
- [ ] Neues Feld `roiSources` (JSON Array) zu customSuperprompts hinzufügen
- [ ] Migration ausführen

### 20.2 Backend APIs
- [ ] `roiSources` in template.list hinzufügen
- [ ] `roiSources` in template.getBySlug hinzufügen
- [ ] `roiSources` in template.getPublicPreview hinzufügen
- [ ] `roiSources` in template.create hinzufügen
- [ ] `roiSources` in template.update hinzufügen
- [ ] `roiSources` in workflow.getTemplateForExecution hinzufügen

### 20.3 ROI-Rechner Modal Komponente
- [ ] Neue Komponente RoiCalculatorModal erstellen
- [ ] Alle ROI-Variablen als Slider/Input-Felder
- [ ] Live-Berechnung bei jeder Änderung
- [ ] Quellenangaben mit Links anzeigen
- [ ] Ausführlicher Disclaimer

### 20.4 Frontend Integration
- [ ] Button "Berechnen Sie Ihren ROI" in TaskExecution
- [ ] Button "Berechnen Sie Ihren ROI" in TaskPreview
- [ ] Modal öffnen bei Klick

### 20.5 Template-Editor
- [ ] Neuer Bereich für Quellenangaben im ROI-Tab
- [ ] Quellen hinzufügen/bearbeiten/löschen
- [ ] Felder: Name, URL, Erkenntnis


## Phase 21: Interaktiver ROI-Rechner mit Quellenangaben (30.01.2026)
- [x] Datenbank: roiSources Feld zu taskTemplates und customSuperprompts hinzugefügt
- [x] Backend: roiSources in template.create, template.update, template.list, template.getBySlug, template.getPublicPreview
- [x] Backend: roiSources in workflow.getTemplateForExecution
- [x] Backend: roiSources in customSuperprompt.updateFull
- [x] Frontend: RoiCalculatorModal Komponente erstellt mit allen Variablen und Quellenangaben
- [x] Frontend: ROI-Rechner Button in TaskExecution hinzugefügt
- [x] Frontend: ROI-Rechner Button in TaskPreview hinzugefügt
- [x] Frontend: Quellenangaben-Bereich im Template-Editor (ROI-Tab) hinzugefügt
- [x] Alle 153 Tests bestanden


## ROI-Rechner Verbesserungen (30.01.2026)
- [x] ROI-Button in TaskExecution und TaskPreview auffälliger gestalten (größer, mit Icon, Gradient)
- [x] Stundensatz-Hinweis: Vermerk dass auch externe Stundensätze (Anwalt) oder Mischkalkulation möglich
- [x] ROI-Modal breiter gemacht (max-w-4xl statt max-w-3xl)


## Bug: lastModifiedByName Fehler beim Template-Speichern (30.01.2026)
- [x] Analysiere warum lastModifiedByName leer ist beim Speichern
- [x] Behebe den Bug: lastModifiedByName und createdByName sind jetzt optional mit Fallback auf ctx.user.name


## Template-Editor Erweiterungen (30.01.2026)
- [ ] Magic Marketing im Marketing-Tab wiederherstellen (verschwunden)
- [ ] Neuer Tab "Disclaimer" mit Magic Disclaimer Funktion (KI-generierter Disclaimer passend zum Prompt)
- [ ] Weitere wichtige Verbesserungen identifizieren


## Template-Editor Erweiterungen (30.01.2026)
- [x] Magic Marketing wiederherstellen (Button im Marketing-Tab)
- [x] Magic Disclaimer Tab implementieren (KI-generierter Disclaimer)
- [x] Datenbank: disclaimer Feld zu taskTemplates und customSuperprompts hinzugefügt
- [x] Backend: generateDisclaimer Endpoint erstellt
- [x] Frontend: Disclaimer-Tab mit Magic Disclaimer Button


## ROI-Rechner UI Verbesserungen (30.01.2026)
- [x] ROI-Modal Eingabefelder breiter machen (max-w-6xl, Input w-20)
- [x] ROI-Button mit orangem Hintergrund für bessere Sichtbarkeit (TaskExecution + TaskPreview)


## Erweiterungen (30.01.2026)
- [x] Standard-Quellenangaben als Beispiel hinzufügen (McKinsey, Deloitte) - im Template-Editor verfügbar
- [x] Disclaimer auf TaskResult-Seite anzeigen - wird nach dem Ergebnis angezeigt
- [x] PDF-Export für ROI-Rechner implementieren - "Als PDF exportieren" Button


## Bug: Disclaimer speichern + Haken-Lösung (30.01.2026)
- [x] Analysiere warum Disclaimer nicht gespeichert wird - disclaimer fehlte in template.list Query
- [x] Bug beheben: disclaimer zu template.list Query hinzugefügt
- [x] Haken-Lösung für Felder im Editor implementiert (✓ grün / ○ grau für alle 7 Tabs)


## Status-Feld im Template-Editor (30.01.2026)
- [ ] Status-Feld zum Template-Editor hinzufügen (Owner-Templates und Custom-Templates)
- [ ] Status-Optionen: draft, active, archived
- [ ] Backend-APIs für Status-Update erweitern falls nötig


## Status-Feld im Template-Editor (30.01.2026)
- [x] Status-Feld zum Template-Editor hinzugefügt (Owner-Templates: draft/active/archived, Custom-Templates: active/paused/archived/change_requested)
- [x] Backend-APIs für Status-Update erweitert (customSuperprompt.updateFull)
- [x] UI mit farbigen Status-Badges im Einstellungen-Tab


## Öffentlich-Feld im Template-Editor (30.01.2026)
- [x] isPublic Feld zum Template-Editor hinzugefügt (Einstellungen-Tab) - UI war bereits vorhanden
- [x] Backend-APIs geprüft - isPublic wird unterstützt
- [x] isPublic zu handleSave hinzugefügt (create und update für Owner-Templates)


## Visuelle Speicher-Bestätigung (31.01.2026)
- [x] Grünes Häkchen nach erfolgreichem Speichern im Template-Editor anzeigen
- [x] Animation für bessere Sichtbarkeit (bounce Animation)
- [x] Button wird grün und zeigt "Erfolgreich gespeichert!" für 1.5 Sekunden


## Kunden-Management Dashboard (31.01.2026)

### Phase 1: Schema-Erweiterungen
- [x] User-Tabelle erweitern: categoryId und businessAreaId Felder hinzufügen
- [x] Migration ausführen

### Phase 2: Backend - Kunden-Management Router
- [x] tRPC Router `customerManagement.getCustomers` - Alle Kunden mit Details
- [x] tRPC Router `customerManagement.getCustomerById` - Einzelner Kunde mit allen Daten
- [x] tRPC Router `customerManagement.getCustomerMembers` - Mitarbeiter eines Kunden
- [x] tRPC Router `customerManagement.updateMemberDepartment` - Kategorie/Bereich zuweisen
- [x] tRPC Router `customerManagement.getCustomerUsageTrends` - Nutzungsstatistiken (Trends)
- [x] tRPC Router `customerManagement.getCustomerTopTemplates` - Top-Templates
- [x] tRPC Router `customerManagement.getCustomerTemplates` - Aktivierte Templates
- [x] tRPC Router `customerManagement.getCustomerCustomTemplates` - Custom-Templates
- [x] tRPC Router `customerManagement.updateCustomerPlan` - Paket ändern
- [x] tRPC Router `customerManagement.getCategories` - Kategorien für Dropdown
- [x] tRPC Router `customerManagement.getBusinessAreas` - Bereiche für Dropdown
- [x] tRPC Router `customerManagement.getAvailablePlans` - Verfügbare Pakete

### Phase 3: Frontend - Kunden-Übersicht
- [x] Neue Seite /admin/kunden erstellen
- [x] Kunden-Liste mit Suche und Filter
- [x] Kunden-Karten mit KPIs (Mitarbeiter, Nutzung, Kosten)
- [x] Paket-Anzeige (Basic/Pro/Enterprise)
- [x] Quick-Actions (Details, Paket ändern)
- [x] Navigation in Sidebar hinzugefügt

### Phase 4: Frontend - Kunden-Detailseite
- [x] Neue Seite /admin/kunden/:id erstellen
- [x] Tab 1: Übersicht (KPIs, Paket, Kosten-Prognose)
- [x] Tab 2: Mitarbeiter (Liste, Rollen, Abteilungs-Zuweisung)
- [x] Tab 3: Nutzung (Charts, Trends, Top-Templates)
- [x] Tab 4: Templates (Aktiviert, Custom)
- [x] Tab 5: Paket (Ändern, Status)

### Phase 5: Mitarbeiter-Verwaltung
- [x] Mitarbeiter-Liste mit Kategorie/Bereich-Anzeige
- [x] Dropdown für Kategorie-Zuweisung (bestehende Kategorien)
- [x] Dropdown für Unternehmensbereich-Zuweisung (bestehende Bereiche)
- [x] Nutzungs-Ampel (Grün/Gelb/Rot) - in Kunden-Übersicht
- [x] Inaktive User Warnung (30+ Tage)

### Phase 6: Paket-Verwaltung
- [x] Paket-Auswahl Dialog (Basic/Pro/Enterprise)
- [x] Limits anzeigen (Aufgaben, Templates, Speicher, Mitarbeiter)
- [x] Upgrade/Downgrade Funktion
- [ ] Paket-Historie anzeigen (später)


## Admin-Navigation Optimierung (31.01.2026)

### Analyse
- [ ] Aktuelle Admin-Struktur dokumentieren
- [ ] Alle Admin-Seiten und Funktionen auflisten
- [ ] Probleme und Verbesserungspotenzial identifizieren

### Optimierungsvorschlag
- [ ] Neue intuitive Struktur vorschlagen
- [ ] Kategorien: Produktion, Kunden, Analyse, Filter
- [ ] Navigation neu organisieren


### Implementierung (31.01.2026)
- [x] Sidebar mit einklappbaren Gruppen implementieren
- [x] Mockup-Badges für jeden Bereich hinzufügen (📊 ÜBERSICHT, 🏭 PRODUKTION, 👥 KUNDEN, 📈 ANALYSE, 🔧 SYSTEM)
- [x] Alle versteckten Seiten in Sidebar sichtbar machen (18 statt 11)
- [x] Redundante Routen entfernen/umleiten (/admin/organizations → /admin/kunden)
- [x] Testing durchführen



## Owner Paket-Verwaltung (31.01.2026)

### Phase 1: Backend
- [x] tRPC Router `subscriptionPlans.getAll` - Alle Pakete laden
- [x] tRPC Router `subscriptionPlans.getById` - Einzelnes Paket laden
- [x] tRPC Router `subscriptionPlans.create` - Neues Paket erstellen
- [x] tRPC Router `subscriptionPlans.update` - Paket bearbeiten
- [x] tRPC Router `subscriptionPlans.delete` - Paket löschen
- [x] tRPC Router `subscriptionPlans.reorder` - Reihenfolge ändern
- [x] tRPC Router `subscriptionPlans.toggleStatus` - Aktivieren/Deaktivieren
- [x] tRPC Router `subscriptionPlans.getStats` - Nutzungs-Statistiken

### Phase 2: Frontend
- [x] Neue Seite /admin/pakete erstellen
- [x] Paket-Karten mit Limits, Features, Preisen
- [x] Paket-Editor Dialog (erstellen/bearbeiten)
- [x] Limits editieren (Benutzer, Credits)
- [x] Features editieren (Liste)
- [x] Preise editieren (Monatlich/Jährlich)
- [x] Test-Paket Konfiguration (Tage)
- [x] Aktivieren/Deaktivieren Toggle
- [x] Löschen mit Schutz (wenn Abos existieren)
- [ ] Paket-Editor Dialog (erstellen/bearbeiten)
- [ ] Limits editieren (Aufgaben, Templates, Speicher, Mitarbeiter)
- [ ] Features editieren (Liste von Features)
- [ ] Preise editieren (Monatlich/Jährlich)
- [ ] Test-Paket Konfiguration (Tage, kostenlos)
- [ ] Drag & Drop für Reihenfolge

### Phase 3: Navigation & Testing
- [ ] Navigation in Sidebar unter SYSTEM hinzufügen
- [ ] Unit-Tests für Router
- [ ] Funktionstest im Browser


## Bug-Fix: Features in Paket-Verwaltung (31.01.2026)
- [x] Features können nicht hinzugefügt werden - Button funktioniert nicht (Event-Propagation behoben)


## Mein Abo Seite für User (31.01.2026)

### Phase 1: Backend
- [x] tRPC Router `userSubscription.getMySubscription` - Aktuelles Abo laden
- [x] tRPC Router `userSubscription.getMyUsage` - Nutzungsstatistiken
- [x] tRPC Router `userSubscription.getAvailablePlans` - Verfügbare Pakete für Upgrade

### Phase 2: Frontend
- [x] Neue Seite /mein-abo erstellen
- [x] Aktuelles Paket mit Features anzeigen
- [x] Credit-Verbrauch und Limits anzeigen
- [x] Nutzungsstatistiken (Aufgaben, Templates)
- [x] Upgrade-Möglichkeit anzeigen (für später)

### Phase 3: Navigation
- [x] Route in App.tsx hinzufügen
- [x] Menüpunkt in User-Navigation hinzufügen


## Testraum für Owner (31.01.2026)

### Phase 1: Datenbank-Schema
- [x] Test-Session Tabelle für Rollen-Wechsel (testSessions)
- [x] Test-Organisation für Owner anlegen (wird dynamisch erstellt)
- [x] Simulierte Test-User Tabelle (testUsers)

### Phase 2: Backend-Router
- [x] tRPC Router `testroom.enterTestMode` - In Testraum wechseln
- [x] tRPC Router `testroom.exitTestMode` - Zurück zum Owner
- [x] tRPC Router `testroom.getCurrentMode` - Aktuellen Modus abfragen
- [x] tRPC Router `testroom.changeScenario` - Szenario wechseln
- [x] tRPC Router `testroom.getTestUsers` - Test-User laden
- [x] tRPC Router `testroom.createTestUser` - Test-User erstellen
- [x] tRPC Router `testroom.updateTestUser` - Test-User bearbeiten
- [x] tRPC Router `testroom.deleteTestUser` - Test-User löschen
- [x] tRPC Router `testroom.resetTestData` - Alle Test-Daten zurücksetzen
- [x] tRPC Router `testroom.inviteTestUser` - Echte Einladung senden
- [x] tRPC Router `testroom.simulateScenario` - Szenarien simulieren (Credits leer, Abo abläuft)

### Phase 3: Frontend - Testraum Dashboard
- [x] Neue Seite /admin/testraum erstellen
- [x] "Als User testen" Button mit Rollen-Wechsel
- [x] "Als Firmen-Admin testen" Button
- [x] Szenarien-Auswahl (Credits leer, Abo abläuft, etc.)
- [x] Zurück zum Owner Button (Banner oben)
- [x] Test-Daten zurücksetzen Button
- [x] Navigation in Sidebar hinzugefügt

### Phase 4: Frontend - Test-Mitarbeiter
- [x] Test-Mitarbeiter Liste
- [x] "Simulierten User erstellen" Dialog
- [x] "Echte Einladung senden" Dialog
- [x] Rollen zuweisen (Admin/Member)
- [x] Abteilungen zuweisen

### Phase 5: Strukturierte Datenablage
- [x] S3 Pfad-Struktur: production/org-{id}/user-{id}/...
- [x] S3 Pfad-Struktur: testing/org-test/user-owner/...
- [x] Storage-Helper für strukturierte Pfade (structuredStorage.ts)
- [x] 15 Unit-Tests für strukturierte Storage
- [ ] Migration bestehender Dateien (optional - später)


## Bugfixes (01.02.2026)
- [x] BUG: Testraum-Seite /admin/testraum funktioniert nicht - JavaScript-Fehler (SelectItem mit leerem value)
- [ ] BUG: Testraum "Test starten" Button funktioniert nicht - User wird nicht in Test-Modus versetzt


## Fehlende Kunden-Funktionen im Kundenraum (01.02.2026)

### Identifizierte fehlende Funktionen:
- [ ] Team-Verwaltung: Als Firmen-Admin andere User einladen (/firma/users fehlt oder funktioniert nicht)
- [ ] Mein Abo: Abo-Status, Credits, Limits anzeigen (Route existiert aber prüfen)
- [ ] Firmen-Dashboard: Nutzungsstatistiken für Firmen-Admin
- [ ] Sidebar-Navigation: Alle Kunden-Funktionen sichtbar machen

### Prüfung der Sidebar-Navigation für Kunden:
- [ ] Startseite ✓
- [ ] Dashboard ✓
- [ ] Neue Aufgabe ✓
- [ ] Meine Templates ✓
- [ ] Meine Dokumente ✓
- [ ] Verlauf ✓
- [ ] Mein Abo (prüfen ob sichtbar)
- [ ] Firmen-Dashboard (nur für Firmen-Admin)
- [ ] Team-Verwaltung (nur für Firmen-Admin)


## Testraum-Verbesserungen (01.02.2026)

### Problem: Test-Modus ändert die App-Ansicht nicht
- [x] Test-Modus Query in DashboardLayout integrieren
- [x] Rollen-Simulation: Wenn Test aktiv, simulierte Rolle statt echte Rolle verwenden
- [x] Test-Banner im Dashboard anzeigen wenn Test-Modus aktiv
- [x] "Test beenden" Button im Banner
- [ ] Automatische Weiterleitung zum Dashboard nach Test-Start (optional)

- [x] BUG: Test-Modus Banner wird im Frontend nicht angezeigt obwohl Test aktiv ist (jetzt auch auf Homepage)

- [x] BUG: Test-Modus als Firmen-Admin zeigt "Keine Firma registriert" - Test-Organisation wird jetzt automatisch verwendet
- [x] Beim Test-Start als Firmen-Admin/Mitarbeiter automatisch Test-Organisation erstellen (war bereits implementiert)
- [x] CompanyDashboard verwendet jetzt testOrganizationId im Test-Modus
- [ ] Test-Organisation mit Beispiel-Daten (Mitarbeiter, Statistiken) befüllen (optional)
- [ ] Beim Test-Ende Test-Organisation wieder löschen (optional)


## Kunden-Dashboard Verbesserung (01.02.2026)
- [x] Kunden-Dashboard so smart und intuitiv wie Owner-Dashboard gestalten
- [x] Tile-Layout mit klaren Symbolen für Funktionen
- [x] Minimalistisches Design mit viel Whitespace
- [x] Schnellzugriff auf wichtigste Funktionen (Tabs: Schnellzugriff, Team, Aktivität, Einstellungen)
- [x] Übersichtliche Statistiken und KPIs (Testphase, Team, Aufgaben, Zeit gespart)
- [x] Backend: getCompanyStats und getCompanyActivity Endpoints hinzugefügt


## User-Dashboard Verbesserung (01.02.2026)
- [x] Normales User-Dashboard (Dashboard.tsx) so smart und intuitiv wie Owner-Dashboard gestalten
- [x] Tile-Layout mit klaren Symbolen für Funktionen (Schnellzugriff-Karten)
- [x] Minimalistisches Design mit viel Whitespace
- [x] Schnellzugriff auf wichtigste Funktionen (Tabs: Schnellzugriff, Beliebte Aufgaben, Aktivitäten)
- [x] Übersichtliche Statistiken und KPIs (4 KPI-Karten mit Hover-Effekten)


## Neue Features (01.02.2026)

### 1. Mitarbeiter-Seite für Firmen-Admins
- [x] CompanyUsers.tsx überarbeiten mit modernem Design (DashboardLayout integriert)
- [x] Einladungs-Dialog mit E-Mail-Eingabe
- [x] Mitarbeiter-Liste mit Status (aktiv, eingeladen, deaktiviert)
- [x] Rollen-Zuweisung (Admin, Mitarbeiter)
- [x] Mitarbeiter entfernen/deaktivieren
- [x] KPI-Karten (Team-Größe, Admins, Einladungen, Aktiv heute)
- [x] Tabs für Mitglieder und Einladungen

### 2. Nutzungs-Statistiken mit Charts
- [x] CompanyStats.tsx erstellen
- [x] Aufgaben-Nutzung pro Mitarbeiter (Bar-Chart)
- [x] Wöchentliche Nutzung (Bar-Chart)
- [x] Top verwendete Templates
- [x] Zeit gespart pro Mitarbeiter
- [x] KPI-Karten mit Trend-Indikatoren
- [x] Tabs: Übersicht, Nach Mitarbeiter, Nach Aufgabe

### 3. Onboarding-Flow für neue Kunden
- [x] OnboardingTour.tsx Komponente erstellen
- [x] Schritt 1: Willkommen bei KI2GO
- [x] Schritt 2: Erste Aufgabe auswählen
- [x] Schritt 3: Ergebnisse speichern
- [x] Schritt 4: Team einladen
- [x] Fortschritts-Anzeige mit Progress Bar
- [x] Überspringen-Option


## Onboarding & E-Mail Features (01.02.2026)

### 1. Onboarding-Tour aktivieren
- [x] Onboarding-Status in User-Tabelle speichern (hasCompletedOnboarding)
- [x] Dashboard prüft ob User neu ist und zeigt Tour
- [x] Tour-Completion speichern wenn User fertig oder überspringt
- [x] Tour nur einmal pro User anzeigen
- [x] completeOnboarding Mutation im user Router erstellt

### 2. E-Mail-Benachrichtigungen
- [x] E-Mail-Service erstellt (server/_core/email.ts)
- [x] E-Mail-Template für Einladungen (sendInvitationEmail)
- [x] E-Mail bei neuer Einladung senden (in createInvitation integriert)
- [x] E-Mail-Template für Abo-Ablauf (sendSubscriptionExpiryReminder)
- [x] E-Mail-Template für niedrige Credits (sendLowCreditsWarning)
- [x] E-Mail-Template für Willkommen (sendWelcomeEmail)
- [ ] E-Mail-Einstellungen im Profil (opt-out) - später


## Kunden-Dashboard Funktionsprüfung (01.02.2026)

### Zu prüfen:
- [x] Alle Links und Buttons im Dashboard testen
- [x] Navigation zurück zum Dashboard von allen Unterseiten
- [x] Funktionen die ins Leere führen identifizieren
- [x] Tote Links beheben
- [x] Fehlende Zurück-Buttons hinzufügen (nicht nötig, alle Seiten haben DashboardLayout)


### Durchgeführte Korrekturen:
- [x] Dashboard.tsx: Link /templates → /meine-templates korrigiert
- [x] Dashboard.tsx: Link /dokumente → /meine-dokumente korrigiert
- [x] CompanyDashboard.tsx: Link /dokumente → /meine-dokumente korrigiert
- [x] CompanySettings.tsx erstellt für /firma/settings Route
- [x] Route /firma/settings in App.tsx hinzugefügt

### Geprüfte Navigation:
- [x] User-Sidebar: Alle 7 Links funktionieren (/, /dashboard, /aufgaben, /meine-templates, /meine-dokumente, /verlauf, /mein-abo)
- [x] Admin-Sidebar: Alle 3 Links funktionieren (/firma/dashboard, /firma/nutzung, /firma/users)
- [x] TaskResult.tsx: Hat Zurück-Navigation (zu Aufgaben, zum Verlauf)
- [x] TaskExecution.tsx: Hat Zurück-Navigation (zu Aufgaben)
- [x] Alle Detail-Seiten verwenden DashboardLayout mit Sidebar → Zurück immer möglich

### Noch zu prüfen:
- [ ] /firma/nutzung (FirmaDashboard.tsx) - Backend-API vorhanden?
- [ ] /firma/stats (CompanyStats.tsx) - Backend-API vorhanden?


### Aktuelle Probleme (02.02.2026)
- [ ] Weiße Seite im Admin-Bereich beheben
- [ ] Export/Import-System für Templates implementieren
- [ ] Unit-Tests für Export/Import schreiben


## Phase 17: Daten-Export/Import System (02.02.2026)

### 17.1 Backend-APIs
- [x] tRPC Router `dataExport.exportAll` - Alle Daten exportieren (Kategorien, Bereiche, Metaprompts, Templates)
- [x] tRPC Router `dataExport.exportTemplates` - Nur Templates exportieren
- [x] tRPC Router `dataExport.importAll` - Daten importieren mit Optionen (skipExisting, updateExisting)
- [x] tRPC Router `dataExport.getStats` - Export-Statistiken abrufen

### 17.2 Frontend-UI (ausstehend)
- [ ] Export-Seite im Admin-Bereich (/admin/export)
- [ ] Export-Buttons (Alle Daten / Nur Templates)
- [ ] Import-Upload mit Drag & Drop
- [ ] Import-Optionen (Bestehende überspringen / aktualisieren)
- [ ] Import-Fortschritt und Ergebnis-Anzeige

### 17.3 Tests
- [ ] Unit-Tests für Export/Import-Router
