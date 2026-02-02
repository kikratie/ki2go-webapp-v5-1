# KI2GO WebApp V5 - Analyse der fehlenden Funktionen

## Basierend auf Dokumentation und Benutzer-Feedback

---

## 1. SUPERPROMPT-GENERATOR (KI-gestützt)

### Was fehlt:
Der automatische Superprompt-Generator, der aus einem **Metaprompt** + **Aufgabenbeschreibung** automatisch einen vollständigen Superprompt generiert.

### Funktionen:

| Feature | Beschreibung |
|---------|--------------|
| **Metaprompt-Auswahl** | Admin wählt ein Metaprompt-Template als Basis |
| **Aufgabenbeschreibung** | Admin gibt Freitext ein (z.B. "Verträge prüfen") |
| **KI-Generierung** | LLM generiert Superprompt basierend auf Metaprompt + Aufgabe |
| **Automatische Variablen-Extraktion** | System erkennt {{VARIABLEN}} im generierten Superprompt |
| **Automatisches Variablen-Schema** | System erstellt JSON-Schema mit Typ, Label, Required |
| **Vorschau** | Admin sieht generierten Superprompt vor dem Speichern |
| **Bearbeitung** | Admin kann generierten Superprompt anpassen |

### Workflow:
```
1. Admin wählt Metaprompt-Template
2. Admin gibt Aufgabenbeschreibung ein
3. System sendet an LLM: "Generiere Superprompt für [Aufgabe] basierend auf [Metaprompt]"
4. LLM generiert Superprompt mit {{VARIABLEN}}
5. System extrahiert Variablen automatisch
6. System erstellt Variablen-Schema (Typ-Erkennung)
7. Admin prüft und speichert
```

---

## 2. DOKUMENT-ANFORDERUNGEN (pro Template)

### Was fehlt:
Einstellungen für Dokument-Upload pro Template.

### Felder:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| **documentRequired** | Boolean | Ist Dokument-Upload erforderlich? |
| **documentCount** | Number | Anzahl erlaubter Dokumente (1-10) |
| **allowedFileTypes** | Array | Erlaubte Dateitypen (PDF, DOCX, etc.) |
| **maxFileSize** | Number | Maximale Dateigröße in MB |
| **maxPages** | Number | Maximale Seitenzahl (für PDFs) |
| **documentRelevanceCheck** | Boolean | Prüft System ob Dokument zur Aufgabe passt? |
| **documentDescription** | Text | Beschreibung welches Dokument erwartet wird |

---

## 3. MASKING-EINSTELLUNGEN

### Was fehlt:
Option ob sensible Daten im Dokument maskiert werden sollen.

### Felder:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| **maskingRequired** | Boolean | Soll Masking angeboten werden? |
| **maskingTypes** | Array | Welche Daten maskieren? (Namen, Adressen, Kontonummern, etc.) |
| **maskingAutoDetect** | Boolean | Automatische Erkennung sensibler Daten? |

---

## 4. KEYWORDS FÜR AUTOMATISCHES MATCHING

### Was fehlt:
Keywords die helfen, das Template bei Nutzer-Anfragen automatisch zu finden.

### Felder:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| **keywords** | Array | Suchbegriffe für Intent-Matching |
| **synonyms** | Array | Alternative Begriffe |
| **exampleQueries** | Array | Beispiel-Anfragen die zu diesem Template passen |

---

## 5. AUTOMATISCHE VARIABLEN-ERSTELLUNG AUS SUPERPROMPT

### Was fehlt:
Button/Funktion die automatisch Variablen aus dem Superprompt-Text extrahiert.

### Funktionen:

| Feature | Beschreibung |
|---------|--------------|
| **Variablen-Scan** | Findet alle {{VARIABLE_NAME}} im Superprompt |
| **Typ-Erkennung** | Erkennt Typ basierend auf Namen (z.B. DOKUMENT → file) |
| **Label-Generierung** | Erstellt lesbare Labels (VERTRAGSTYP → "Vertragstyp") |
| **Schema-Generierung** | Erstellt vollständiges JSON-Schema |
| **Sync-Warnung** | Warnt wenn Variable im Prompt aber nicht im Schema |

---

## 6. METAPROMPT-VERWALTUNG

### Was fehlt:
Separate Verwaltung der Metaprompt-Templates.

### Funktionen:

| Feature | Beschreibung |
|---------|--------------|
| **Metaprompt-Liste** | Alle Versionen anzeigen |
| **Metaprompt-Editor** | Code-Editor mit Syntax-Highlighting |
| **Versionierung** | V1, V2, V3, etc. |
| **Standard-Markierung** | Eine Version als "aktiv" markieren |
| **Variablen-Vorschau** | Zeigt alle {{PLATZHALTER}} im Metaprompt |

---

## 7. ERWEITERTE TEMPLATE-EINSTELLUNGEN

### Was aktuell fehlt im Template-Editor:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| **estimatedTimeSavings** | Number | Geschätzte Zeitersparnis in Minuten |
| **creditCost** | Number | Credit-Kosten pro Ausführung |
| **llmModel** | Select | Bevorzugtes LLM-Modell |
| **llmTemperature** | Number | Temperature-Einstellung (0.0-1.0) |
| **maxTokens** | Number | Maximale Token-Anzahl |
| **outputFormat** | Select | Ausgabeformat (Markdown, JSON, Text) |
| **exampleOutput** | Textarea | Beispiel-Ergebnis zur Orientierung |

---

## ZUSAMMENFASSUNG: Was muss implementiert werden

### Priorität 1 (Kritisch):
1. **Superprompt-Generator** - KI-gestützte automatische Generierung
2. **Automatische Variablen-Extraktion** - Aus Superprompt-Text
3. **Dokument-Anforderungen** - Pro Template konfigurierbar

### Priorität 2 (Wichtig):
4. **Keywords für Matching** - Bessere Intent-Erkennung
5. **Metaprompt-Verwaltung** - Separate Seite für Metaprompts
6. **Masking-Einstellungen** - Datenschutz-Option

### Priorität 3 (Nice-to-have):
7. **Erweiterte LLM-Einstellungen** - Model, Temperature, MaxTokens
8. **Beispiel-Output** - Zur Orientierung für Nutzer

---

## Technische Umsetzung

### Datenbank-Erweiterungen:
- `taskTemplates` Tabelle erweitern um neue Felder
- `metapromptTemplates` Tabelle erstellen (falls nicht vorhanden)

### Backend-APIs:
- `template.generateFromMetaprompt` - KI-Generierung
- `template.extractVariables` - Variablen aus Text extrahieren
- `metaprompt.list`, `metaprompt.create`, `metaprompt.setActive`

### Frontend:
- Superprompt-Generator Seite (`/admin/generator`)
- Metaprompt-Verwaltung Seite (`/admin/metaprompts`)
- Template-Editor erweitern um neue Felder
