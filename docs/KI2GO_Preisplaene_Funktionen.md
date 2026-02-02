# KI2GO - Preispläne, Funktionen und Monetarisierungsstrategie

**Version:** 2.0  
**Stand:** 29. Januar 2026  
**Autor:** Manus AI für ProAgentur GmbH

---

## Inhaltsverzeichnis

1. [Executive Summary](#1-executive-summary)
2. [Aktuelle Funktionsübersicht](#2-aktuelle-funktionsübersicht)
3. [Preisplan-Struktur](#3-preisplan-struktur)
4. [Feature-Matrix nach Plan](#4-feature-matrix-nach-plan)
5. [Masking-Strategie](#5-masking-strategie)
6. [Testphase und Onboarding](#6-testphase-und-onboarding)
7. [Token-Schutz und Fair-Use](#7-token-schutz-und-fair-use)
8. [Upselling-Strategie](#8-upselling-strategie)
9. [Admin-Preisdashboard (NEU)](#9-admin-preisdashboard-neu)
10. [Implementierungsplan](#10-implementierungsplan)
11. [Offene Entscheidungen](#11-offene-entscheidungen)

---

## 1. Executive Summary

KI2GO ist eine B2B-SaaS-Plattform, die Unternehmen ermöglicht, KI-gestützte Aufgaben auszuführen, ohne selbst KI-Expertise zu benötigen. Das System basiert auf einem **Superprompt-Template-System**, bei dem vordefinierte Aufgaben-Templates von Kunden verwendet werden können.

**Kernprinzip:** "Ergebnisse statt chatten!" - Kunden erhalten sofort nutzbare Ergebnisse, ohne mit KI chatten zu müssen.

**Zielmarkt:** KMUs in Österreich (primär), dann DACH-Raum, alle Branchen.

**Geschäftsmodell:** Abo-Modell mit zukaufbaren Masking-Paketen.

---

## 2. Aktuelle Funktionsübersicht

### 2.1 Implementierte Kernfunktionen

| Bereich | Funktion | Status |
|---------|----------|--------|
| **Aufgaben-Ausführung** | Superprompt-Templates ausführen | ✅ Implementiert |
| | Dokument-Upload mit OCR-Prüfung | ✅ Implementiert |
| | Variablen-Formular mit Vorausfüllung | ✅ Implementiert |
| | Ergebnis mit Markdown-Rendering | ✅ Implementiert |
| | Export (TXT, HTML, PDF) | ✅ Implementiert |
| | ROI-Banner (Zeitersparnis) | ✅ Implementiert |
| **Kundenraum** | Eigener Datenraum pro Organisation | ✅ Implementiert |
| | Templates in Kundenraum kopieren | ✅ Implementiert |
| | Firmenlogo + Branding | ✅ Implementiert |
| | Plan-Statusleiste | ✅ Implementiert |
| **Dokumenten-Manager** | Upload und Verwaltung | ✅ Implementiert |
| | Speicherplatz-Tracking | ✅ Implementiert |
| **Verlauf** | Alle Ausführungen einsehen | ✅ Implementiert |
| | Ergebnisse erneut öffnen | ✅ Implementiert |
| **Bewertung** | Daumen hoch/runter | ✅ Implementiert |
| | Verbesserungsvorschläge | ✅ Implementiert |
| **Firmen-Admin** | Mitarbeiter einladen | ✅ Implementiert |
| | Nutzungs-Dashboard | ✅ Implementiert |
| | Mitarbeiter-Statistiken | ✅ Implementiert |
| **Owner-Dashboard** | Alle Firmen/User verwalten | ✅ Implementiert |
| | Kosten-Tracking (Manus) | ✅ Implementiert |
| | Prozess-Protokoll | ✅ Implementiert |

### 2.2 Geplante Features

| Feature | Priorität | Beschreibung |
|---------|-----------|--------------|
| **Masking (Daten-Anonymisierung)** | Hoch | Sensible Daten vor LLM-Verarbeitung anonymisieren |
| **Admin-Preisdashboard** | Hoch | Flexible Verwaltung von Plänen, Limits und Features |
| **Batch-Verarbeitung** | Mittel | Mehrere Dokumente gleichzeitig verarbeiten |
| **API-Zugang** | Mittel | Programmatischer Zugriff für Integrationen |
| **Stripe-Integration** | Hoch | Automatische Zahlungsabwicklung |

---

## 3. Preisplan-Struktur

### 3.1 Drei Pläne (kein separater Test-Plan)

| Plan | Preis/Monat | User | Zielgruppe |
|------|-------------|------|------------|
| **Starter** | 150 € | Bis 5 | Kleine Teams, Einsteiger |
| **Business** | 490 € | Bis 20 | Mittelstand, wachsende Teams |
| **Enterprise** | Auf Anfrage | Unbegrenzt | Großunternehmen |

**Wichtig:** Es gibt keinen separaten "Test"-Plan. Neukunden erhalten den **Starter-Plan für 14 Tage kostenlos** freigeschaltet (Dauer flexibel anpassbar durch Admin).

### 3.2 Plan-Details

#### Starter-Plan (150 €/Monat)

| Merkmal | Wert |
|---------|------|
| **User** | Bis zu 5 |
| **Aufgaben/Monat** | 100 (flexibel anpassbar) |
| **Templates** | 10 (öffentliche + kopierte) |
| **Speicher** | 1 GB |
| **Masking** | Inkludiert (Menge noch zu definieren) |
| **Support** | E-Mail (48h Antwortzeit) |
| **Testphase** | 14 Tage kostenlos (verlängerbar) |

**Features:** Eigener Datenraum, Verlauf, Export, Bewertungen, Anpassungswünsche, Masking

#### Business-Plan (490 €/Monat)

| Merkmal | Wert |
|---------|------|
| **User** | Bis zu 20 |
| **Aufgaben/Monat** | 500 (flexibel anpassbar) |
| **Templates** | 50 |
| **Speicher** | 10 GB |
| **Masking** | Mehr Kontingent (noch zu definieren) |
| **Support** | E-Mail (24h) + Telefon |

**Features:** Alles aus Starter + Mitarbeiter-Freigaben, Nutzungs-Dashboard, Mitarbeiter-Statistiken, Template-Kategorien

#### Enterprise-Plan (Auf Anfrage)

| Merkmal | Wert |
|---------|------|
| **User** | Unbegrenzt |
| **Aufgaben/Monat** | Unbegrenzt |
| **Templates** | Unbegrenzt |
| **Speicher** | 100 GB+ |
| **Masking** | Unbegrenzt oder nach Vereinbarung |
| **Support** | Dedizierter Account Manager |

**Features:** Alles aus Business + Priority-Verarbeitung, SLA-Garantie, Custom Templates auf Anfrage, API-Zugang

---

## 4. Feature-Matrix nach Plan

### 4.1 Kernfunktionen

| Feature | Starter | Business | Enterprise |
|---------|---------|----------|------------|
| Aufgaben ausführen | ✅ (100/Monat) | ✅ (500/Monat) | ✅ (Unbegrenzt) |
| Dokument-Upload | ✅ | ✅ | ✅ |
| Ergebnis-Export (TXT, HTML, PDF) | ✅ | ✅ | ✅ |
| ROI-Anzeige | ✅ | ✅ | ✅ |
| Bewertung & Feedback | ✅ | ✅ | ✅ |

### 4.2 Kundenraum-Funktionen

| Feature | Starter | Business | Enterprise |
|---------|---------|----------|------------|
| Eigener Datenraum | ✅ | ✅ | ✅ |
| Templates kopieren | ✅ | ✅ | ✅ |
| Firmenlogo/Branding | ✅ | ✅ | ✅ |
| Template-Kategorien | ❌ | ✅ | ✅ |
| Anpassungswünsche | ✅ | ✅ | ✅ |

### 4.3 Team-Funktionen

| Feature | Starter | Business | Enterprise |
|---------|---------|----------|------------|
| Mitarbeiter einladen | ✅ (5 User) | ✅ (20 User) | ✅ (Unbegrenzt) |
| Template-Freigaben | ❌ | ✅ | ✅ |
| Nutzungs-Dashboard | ❌ | ✅ | ✅ |
| Mitarbeiter-Statistiken | ❌ | ✅ | ✅ |

### 4.4 Masking & Premium-Funktionen

| Feature | Starter | Business | Enterprise |
|---------|---------|----------|------------|
| **Masking (Anonymisierung)** | ✅ (Basis-Kontingent) | ✅ (Mehr Kontingent) | ✅ (Unbegrenzt) |
| **Masking-Pakete zukaufen** | ✅ | ✅ | Nach Vereinbarung |
| Priority-Verarbeitung | ❌ | ❌ | ✅ |
| API-Zugang | ❌ | ❌ | ✅ |
| Custom Templates | ❌ | ❌ | ✅ (auf Anfrage) |
| SLA-Garantie | ❌ | ❌ | ✅ |

---

## 5. Masking-Strategie

### 5.1 Masking ab Starter verfügbar

**Masking** (Daten-Anonymisierung) ist ein Differenzierungsmerkmal von KI2GO und ab dem Starter-Plan verfügbar. Dies unterscheidet KI2GO von Wettbewerbern, die Masking oft nur in teuren Enterprise-Plänen anbieten.

### 5.2 Kontingent-Struktur (noch zu definieren)

| Plan | Inkludiertes Masking | Zukauf möglich |
|------|---------------------|----------------|
| **Starter** | X Seiten/Monat | ✅ Ja |
| **Business** | Y Seiten/Monat | ✅ Ja |
| **Enterprise** | Unbegrenzt | Nach Vereinbarung |

### 5.3 Zukaufbare Masking-Pakete (Vorschlag)

| Paket | Seiten | Preis | Preis/Seite |
|-------|--------|-------|-------------|
| **Basic** | 100 Seiten | 10 € | 0,10 € |
| **Standard** | 500 Seiten | 40 € | 0,08 € |
| **Premium** | 1.000 Seiten | 70 € | 0,07 € |

**Hinweis:** Die genauen Mengen und Preise werden basierend auf Testkunden-Nutzung festgelegt.

---

## 6. Testphase und Onboarding

### 6.1 Testphase = Starter-Plan kostenlos

Neukunden erhalten den **Starter-Plan für 14 Tage kostenlos** freigeschaltet. Dies ist kein separater "Test"-Plan, sondern der vollwertige Starter-Plan mit allen Features.

| Merkmal | Wert |
|---------|------|
| **Standard-Dauer** | 14 Tage |
| **Verlängerbar** | Ja (durch Admin flexibel anpassbar) |
| **Alle Starter-Features** | ✅ Ja |
| **Nutzungs-Dashboard** | ✅ Ja (für Analyse) |
| **Masking** | ✅ Ja (Basis-Kontingent) |

### 6.2 Vollständige Anmeldung erforderlich

Für die Testphase ist eine **vollständige Registrierung** mit allen Daten erforderlich. Dies ermöglicht aktive Kundenbetreuung und Nutzungsanalyse.

| Schritt | Pflichtfelder |
|---------|---------------|
| **1. Login** | OAuth (Google/Microsoft) |
| **2. Profil** | Vorname, Nachname, E-Mail |
| **3. Firma** | Firmenname, Branche, Mitarbeiteranzahl |
| **4. Kontakt** | Position, Telefon, Adresse |
| **5. Zustimmung** | AGB, Datenschutz |

### 6.3 Testphase-Banner

Das System zeigt automatisch Banner basierend auf der verbleibenden Testzeit:

| Verbleibende Tage | Banner-Farbe | Nachricht |
|-------------------|--------------|-----------|
| > 7 Tage | Grün | "Willkommen! Ihre Testphase läuft noch X Tage." |
| 3-7 Tage | Gelb | "Ihre Testphase endet in X Tagen. Jetzt Plan sichern!" |
| 1-3 Tage | Orange | "Nur noch X Tage! Sichern Sie sich Ihren Plan." |
| 0 Tage | Rot | "Testphase abgelaufen. Aktivieren Sie Ihren Plan!" |

---

## 7. Token-Schutz und Fair-Use

### 7.1 Schutzmaßnahmen

| Maßnahme | Beschreibung | Status |
|----------|--------------|--------|
| **Aufgaben-Limit** | Max. Aufgaben pro Monat pro Plan | ✅ Implementiert |
| **Token-Tracking** | Verbrauch pro Aufgabe erfassen | ✅ Implementiert |
| **Soft-Limit** | Warnung bei 80% Verbrauch | ⏳ Geplant |
| **Hard-Limit** | Blockierung bei 100% | ✅ Implementiert |
| **Dokument-Größe** | Max. 50 MB pro Dokument | ✅ Implementiert |

### 7.2 Token-Kosten (Gemini 2.5 Flash)

| Metrik | Kosten |
|--------|--------|
| Input-Tokens | 0,00007 €/1K Tokens |
| Output-Tokens | 0,00028 €/1K Tokens |
| Durchschnitt pro Aufgabe | ~0,01-0,05 € |

### 7.3 Fair-Use bei Testphase

Bei übermäßigem Verbrauch in der Testphase:

1. **Warnung** bei 80% des Limits
2. **Soft-Block** bei 100% (nur neue Aufgaben blockiert)
3. **Kontaktaufnahme** durch Owner bei auffälligem Verhalten
4. **Upgrade-Angebot** für mehr Kapazität

---

## 8. Upselling-Strategie

### 8.1 Kernstrategie

Die Upselling-Strategie basiert auf dem Prinzip: **"Zeige den Wert, dann verkaufe."**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UPSELLING-TRICHTER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   1. STARTER TESTEN (14 Tage kostenlos)                             │
│      └─▶ Alle Starter-Features nutzen                               │
│          └─▶ Wert der Ergebnisse erleben                            │
│                                                                     │
│   2. STARTER AKTIVIEREN (150 €/Monat)                               │
│      └─▶ Weiterhin alle Features nutzen                             │
│          └─▶ Team wächst, mehr Aufgaben benötigt                    │
│                                                                     │
│   3. BUSINESS UPGRADE (490 €/Monat)                                 │
│      └─▶ Mehr User, mehr Aufgaben                                   │
│          └─▶ Nutzungs-Dashboard für Management                      │
│                                                                     │
│   4. ENTERPRISE / CUSTOM SOLUTIONS                                  │
│      └─▶ Anpassungswünsche einreichen                               │
│          └─▶ Individuelle Templates entwickeln                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Upselling-Trigger

| Trigger | Aktion | Ziel |
|---------|--------|------|
| Testphase endet | E-Mail + Banner | Starter aktivieren |
| 5 User erreicht | Upgrade-Hinweis | Business |
| Masking-Kontingent erschöpft | Paket-Angebot | Masking-Paket zukaufen |
| Anpassungswunsch | Angebot erstellen | Custom Solution |
| 80% Limit erreicht | Upgrade-Angebot | Nächster Plan |

### 8.3 Custom Solutions als Upselling-Produkt

Wenn ein Kunde ein individuelles Template anfragt, wird dieses:
1. Für den Kunden entwickelt (kostenpflichtig)
2. Anschließend **produktisiert** und anderen Kunden angeboten
3. Der Ursprungskunde erhält ggf. Rabatt auf zukünftige Nutzung

---

## 9. Admin-Preisdashboard (NEU)

### 9.1 Zweck

Ein Dashboard für den Owner/Admin, um Pläne, Limits und Features **flexibel zu verwalten** ohne Code-Änderungen. Dies ermöglicht schnelle Reaktion auf Marktfeedback.

### 9.2 Geplante Funktionen

| Funktion | Beschreibung |
|----------|--------------|
| **Plan-Verwaltung** | Preise, Namen, Beschreibungen anpassen |
| **Limit-Verwaltung** | Aufgaben, Speicher, User, Masking pro Plan |
| **Feature-Toggles** | Features pro Plan ein-/ausschalten |
| **Testphasen-Verwaltung** | Dauer pro Kunde verlängern/verkürzen |
| **Masking-Pakete** | Pakete erstellen, Preise anpassen |
| **Kunden-Übersicht** | Welcher Kunde hat welchen Plan, wann läuft er aus |

### 9.3 Implementierungsstatus

| Feature | Status |
|---------|--------|
| Pläne in Datenbank | ✅ Implementiert |
| Limits in Datenbank | ✅ Implementiert |
| Feature-Flags in Datenbank | ✅ Implementiert |
| Admin-UI für Plan-Verwaltung | ⏳ Noch zu implementieren |
| Testphasen-Verlängerung | ⏳ Noch zu implementieren |
| Masking-Paket-Verwaltung | ⏳ Noch zu implementieren |

---

## 10. Implementierungsplan

### 10.1 Bereits implementiert

| Feature | Status |
|---------|--------|
| Drei Pläne (Starter, Business, Enterprise) | ✅ |
| Limits pro Plan in Datenbank | ✅ |
| Feature-Gates (Task-Limit) | ✅ |
| Token-Tracking | ✅ |
| Nutzungs-Dashboard | ✅ |
| Owner Manus-Kosten Dashboard | ✅ |

### 10.2 Nächste Schritte

| Feature | Priorität | Aufwand |
|---------|-----------|---------|
| **Admin-Preisdashboard** | Hoch | 8-16h |
| **Testphasen-Verwaltung** | Hoch | 4-8h |
| **Masking-Feature** | Hoch | 16-32h |
| **Masking-Paket-Zukauf** | Mittel | 8-16h |
| **Stripe-Integration** | Hoch | 8-16h |
| **E-Mail-Benachrichtigungen** | Mittel | 4-8h |

---

## 11. Offene Entscheidungen

### 11.1 Masking-Kontingente

| Frage | Optionen | Empfehlung |
|-------|----------|------------|
| Starter-Kontingent | 50, 100, 200 Seiten/Monat | Basierend auf Testnutzung entscheiden |
| Business-Kontingent | 200, 500, 1000 Seiten/Monat | Basierend auf Testnutzung entscheiden |
| Paket-Preise | Siehe Vorschlag oben | Flexibel anpassbar |

### 11.2 Limits

| Frage | Optionen | Empfehlung |
|-------|----------|------------|
| Starter-Aufgaben | 50, 100, 200 | 100 (Standard) |
| Business-Aufgaben | 300, 500, 1000 | 500 (Standard) |
| Testphasen-Dauer | 7, 14, 30 Tage | 14 Tage (Standard) |

### 11.3 Features

| Frage | Optionen | Empfehlung |
|-------|----------|------------|
| Nutzungs-Dashboard | Starter / Business | Business only |
| API-Zugang | Business / Enterprise | Enterprise only |
| Custom Templates | Alle / Enterprise | Enterprise + Einzelkauf |

---

## Zusammenfassung

KI2GO bietet ein klares, skalierbares Preismodell mit drei Stufen:

1. **Starter (150 €/Monat):** Für kleine Teams bis 5 User, inkl. Masking
2. **Business (490 €/Monat):** Für Mittelstand bis 20 User mit Team-Features
3. **Enterprise (Auf Anfrage):** Für Großunternehmen mit Premium-Features

**Kernprinzipien:**
- **Kein separater Test-Plan** - Neukunden erhalten Starter für 14 Tage kostenlos
- **Vollständige Anmeldung** für aktive Kundenbetreuung
- **Masking ab Starter** als Differenzierungsmerkmal
- **Zukaufbare Masking-Pakete** für Flexibilität
- **Admin-Preisdashboard** für flexible Verwaltung ohne Code-Änderungen
- **Vollständiges Tracking** für datenbasierte Entscheidungen

---

*Dieses Dokument wurde am 29. Januar 2026 aktualisiert (Version 2.0) und spiegelt den aktuellen Stand der KI2GO-Plattform wider.*
