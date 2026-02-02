# KI2GO Test-Checkliste

## Automatisierte Tests: ✅ 95/95 bestanden

| Test-Datei | Tests | Status |
|------------|-------|--------|
| workflow.test.ts | 12 | ✅ |
| onboarding.test.ts | 23 | ✅ |
| audit.test.ts | 18 | ✅ |
| template.test.ts | 11 | ✅ |
| category.test.ts | 8 | ✅ |
| metaprompt.test.ts | 8 | ✅ |
| customSuperprompt.test.ts | 9 | ✅ |
| document.test.ts | 5 | ✅ |
| auth.logout.test.ts | 1 | ✅ |

## TypeScript: ✅ Keine Fehler

---

## Manuelle Test-Checkliste

### 1. Authentifizierung & Benutzer
- [ ] Login mit Manus OAuth funktioniert
- [ ] Logout funktioniert
- [ ] Benutzer-Profil wird korrekt angezeigt
- [ ] Rollen werden korrekt erkannt (User/Admin/Owner)

### 2. Landing Page
- [ ] Hero-Section wird korrekt angezeigt
- [ ] Verfügbare Aufgaben werden geladen
- [ ] Quick-Action-Buttons funktionieren
- [ ] Cookie-Banner erscheint und kann akzeptiert werden

### 3. Aufgaben-Katalog (/aufgaben)
- [ ] Alle aktiven Templates werden angezeigt
- [ ] Filter nach Kategorie funktioniert
- [ ] Filter nach Unternehmensbereich funktioniert
- [ ] Suche funktioniert
- [ ] Klick auf Aufgabe öffnet Ausführungs-Seite

### 4. Aufgaben-Ausführung (/aufgabe/:slug)
- [ ] Template wird korrekt geladen
- [ ] Marketing-Banner erscheint (wenn aktiviert)
- [ ] ROI-Berechnung wird angezeigt
- [ ] Dokument-Upload funktioniert
- [ ] Variablen-Formular wird korrekt generiert
- [ ] LLM-Ausführung funktioniert
- [ ] Ergebnis wird korrekt angezeigt
- [ ] Bewertung (Daumen hoch/runter) funktioniert
- [ ] Download (TXT/HTML) funktioniert

### 5. Admin-Bereich (/admin)

#### 5.1 Template-Verwaltung (/admin/templates)
- [ ] Alle Templates werden geladen
- [ ] Neues Template erstellen funktioniert
- [ ] Template bearbeiten funktioniert
- [ ] Template löschen funktioniert
- [ ] Template duplizieren funktioniert
- [ ] Status aktivieren/deaktivieren funktioniert
- [ ] **6 Tabs werden korrekt angezeigt** (Grunddaten, Variablen, Superprompt, ROI, Marketing, Einstellungen)
- [ ] **Marketing-Tab: KI-Generierung funktioniert**
- [ ] **Marketing-Tab: Änderungen werden gespeichert**
- [ ] **ROI-Tab: Werte werden gespeichert**

#### 5.2 Custom Templates (/admin/custom-templates)
- [ ] Alle Custom-Templates werden geladen
- [ ] **Basis-Template zeigt Original-ID** (nicht "Unbekannt")
- [ ] Filter nach Typ funktioniert (User/Org/Global)
- [ ] Bearbeiten funktioniert
- [ ] Löschen funktioniert

#### 5.3 Kategorien (/admin/kategorien)
- [ ] Alle Kategorien werden geladen
- [ ] Neue Kategorie erstellen funktioniert
- [ ] Kategorie bearbeiten funktioniert
- [ ] Kategorie löschen funktioniert

#### 5.4 Unternehmensbereiche (/admin/bereiche)
- [ ] Alle Bereiche werden geladen
- [ ] Neuer Bereich erstellen funktioniert
- [ ] Bereich bearbeiten funktioniert
- [ ] Bereich löschen funktioniert

#### 5.5 Anfragen (/admin/anfragen)
- [ ] Alle Anfragen werden geladen
- [ ] Status ändern funktioniert
- [ ] Angebot erstellen funktioniert
- [ ] Filter nach Status funktioniert

#### 5.6 Firmen (/admin/firmen)
- [ ] Alle Firmen werden geladen
- [ ] Neue Firma erstellen funktioniert
- [ ] Firma bearbeiten funktioniert
- [ ] Mitglieder verwalten funktioniert
- [ ] Templates zuweisen funktioniert

#### 5.7 Benutzer (/admin/benutzer)
- [ ] Alle Benutzer werden geladen
- [ ] Benutzer-Details anzeigen funktioniert
- [ ] Rolle ändern funktioniert

### 6. Kunden-Bereich

#### 6.1 Dashboard (/dashboard)
- [ ] Statistiken werden korrekt angezeigt
- [ ] Letzte Aktivitäten werden geladen
- [ ] Quick-Actions funktionieren

#### 6.2 Meine Templates (/meine-templates) - NEU
- [ ] Custom-Templates des Benutzers werden geladen
- [ ] Statistik-Karten zeigen korrekte Werte
- [ ] Kategorien-Sidebar wird angezeigt
- [ ] Neue Kategorie erstellen funktioniert
- [ ] Template einer Kategorie zuweisen funktioniert
- [ ] Template aus Kategorie entfernen funktioniert
- [ ] Mitarbeiter-Freigabe funktioniert (nur Business Plan)
- [ ] Plan-Badge wird korrekt angezeigt

#### 6.3 Meine Dokumente (/meine-dokumente)
- [ ] Dokumente werden geladen
- [ ] Upload funktioniert
- [ ] Download funktioniert
- [ ] Löschen funktioniert

#### 6.4 Verlauf (/verlauf)
- [ ] Alle Ausführungen werden geladen
- [ ] Filter funktioniert
- [ ] Ergebnis erneut anzeigen funktioniert

### 7. Firmen-Onboarding
- [ ] Firma registrieren funktioniert
- [ ] Einladungs-Link erstellen funktioniert
- [ ] Mit Einladungs-Code beitreten funktioniert

### 8. Rechtliche Seiten
- [ ] AGB (/agb) - **ProAgentur GmbH** (nicht Winitec)
- [ ] Datenschutz (/datenschutz) - **ProAgentur GmbH**
- [ ] Impressum (/impressum)
- [ ] Kontakt (/kontakt) - **ProAgentur GmbH**

---

## Bekannte Probleme

### Behoben in dieser Session:
1. ✅ Marketing-Tab Layout (Tabs überlappen) - behoben
2. ✅ Marketing-Felder werden nicht gespeichert - behoben
3. ✅ Template-Speicherung (lastModifiedByName leer) - behoben
4. ✅ Slug-Validierung (Großbuchstaben abgelehnt) - behoben
5. ✅ Basis-Template zeigt "Unbekannt" - behoben
6. ✅ Winitec → ProAgentur in AGB/Datenschutz/Kontakt - behoben

### Noch zu testen:
- [ ] Custom Template ID-Struktur (SP-2026-001-K42-V1)
- [ ] ROI-Banner auf Ergebnis-Seite
- [ ] Template-Statistiken pro Kunde

---

## Feature-System (Neu implementiert)

### Datenbank-Tabellen:
- ✅ `plans` - Preispläne mit Limits und Features
- ✅ `userSubscriptions` - User-Plan-Zuordnung
- ✅ `usageTracking` - Nutzungs-Tracking pro Monat
- ✅ `templateCategories` - Kunden-Kategorien
- ✅ `templateCategoryAssignments` - Template-Kategorie-Zuordnung
- ✅ `templateMemberAssignments` - Mitarbeiter-Freigaben

### Backend-Helpers:
- ✅ `checkFeature(userId, featureKey)` - Feature-Prüfung
- ✅ `checkLimit(userId, limitKey)` - Limit-Prüfung
- ✅ `incrementUsage(userId, type)` - Usage erhöhen
- ✅ `getUserPlan(userId)` - Plan laden

### Noch zu implementieren:
- [ ] Standard-Pläne in DB anlegen (Free, Starter, Business, Enterprise)
- [ ] Feature-Gates in workflow.execute aktivieren
- [ ] Plan-Upgrade UI für Kunden
