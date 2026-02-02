# Template-Editor & Superprompt-Logik - Änderungsdokumentation

**Version:** 2.0  
**Datum:** 29. Januar 2026  
**Autor:** Manus AI

---

## Übersicht

Dieses Dokument beschreibt alle Änderungen am Template-Editor und der Superprompt-Logik, die zur Behebung von Stabilitätsproblemen und zur Verbesserung der Benutzerfreundlichkeit durchgeführt wurden.

---

## 1. DOKUMENT-Variable Problem (Kritischer Bug)

### Problem
Templates, die ein Dokument benötigen, hatten zwei widersprüchliche Definitionen:
- `documentRequired=1` → Separater Upload-Schritt vor dem Formular
- `DOKUMENT` Variable im `variableSchema` → File-Input im Formular

Dies führte dazu, dass:
- Der Dokument-Text nach dem Upload nicht im Splitscreen angezeigt wurde
- Das Formular ein zusätzliches (unnötiges) File-Input-Feld zeigte
- Die Aufgabenausführung fehlschlug oder inkonsistente Ergebnisse lieferte

### Lösung

#### 1.1 Betroffene Templates korrigiert
Die `DOKUMENT` Variable wurde aus dem `variableSchema` folgender Templates entfernt:

| Template ID | Titel | Slug |
|-------------|-------|------|
| 150078 | Bilanz Monat prüfen | SP-2026-003 |
| 150101 | Vertrag prüfen | - |
| 150185 | Vertragsanalyse 2 | SP-2026-004 |
| 240013 | CV Analyse und Bewertung | SP-2026-006 |

**SQL-Script:** `/home/ubuntu/ki2go-webapp-v5/scripts/fix-document-variables.mjs`

#### 1.2 Superprompt-Generator angepasst
**Datei:** `server/routers/metaprompt.ts`

**Änderung im System-Prompt (Zeile 536-538):**
```
6. WICHTIG: Erstelle KEINE {{DOKUMENT}} Variable für Datei-Uploads!
   Dokumente werden über einen separaten Upload-Schritt bereitgestellt.
   Referenziere das Dokument im Prompt einfach als "das hochgeladene Dokument" oder "die bereitgestellte Datei".
```

#### 1.3 saveAsTemplate Mutation erweitert
**Datei:** `server/routers/metaprompt.ts`

**Neue Parameter im Input-Schema:**
```typescript
documentRequired: z.number().optional().default(1), // Standard: Dokument erforderlich
documentCount: z.number().optional().default(1),
```

**Automatische DOKUMENT-Filterung (Zeile 699-700):**
```typescript
// DOKUMENT-Variable aus Schema entfernen (wird über separaten Upload geliefert)
const cleanedVariableSchema = input.variableSchema.filter(v => v.key !== 'DOKUMENT');
```

**Automatische Dokument-Einstellungen (Zeile 727-729):**
```typescript
// Dokument-Einstellungen (Standard: Dokument erforderlich)
documentRequired: input.documentRequired ?? 1,
documentCount: input.documentCount ?? 1,
```

---

## 2. Template-Editor UI-Verbesserungen

### 2.1 Dialog-Größe erweitert
**Datei:** `client/src/pages/AdminTemplates.tsx`

| Vorher | Nachher |
|--------|---------|
| `max-w-4xl` (896px) | `max-w-[1400px]` (1400px) |
| Feste Höhe | `max-h-[90vh]` mit Overflow-Scroll |

### 2.2 Tab-Navigation verbessert
- Größere Tab-Buttons mit Icons
- Bessere visuelle Trennung der Tabs
- Responsive Anpassung

### 2.3 Textarea-Felder vergrößert
| Feld | Vorher | Nachher |
|------|--------|---------|
| Superprompt | 15 Zeilen | 25 Zeilen + resizable |
| Beschreibung | 3 Zeilen | 6 Zeilen + resizable |

---

## 3. Datenbank-Änderungen

### 3.1 Plan-Limits angepasst
**Script:** `/home/ubuntu/ki2go-webapp-v5/scripts/seed-plans.mjs`

| Plan | taskLimit | teamMemberLimit | Features |
|------|-----------|-----------------|----------|
| Free | 10 | 1 | Basis (deaktiviert) |
| Starter | 100 | 5 | + Masking |
| Business | 500 | 20 | + Masking, template_sharing |
| Enterprise | 999999 | 999999 | Alle Features |

### 3.2 documentRequired für Templates gesetzt
Alle Templates mit Dokument-Anforderung haben jetzt `documentRequired=1`:

```sql
UPDATE taskTemplates 
SET documentRequired = 1, documentCount = 1 
WHERE id IN (4, 150078, 150101, 150185, 240013);
```

---

## 4. Architektur-Regeln für zukünftige Entwicklung

### 4.1 Dokument-Handling
> **REGEL:** Wenn ein Template ein Dokument benötigt, verwende IMMER `documentRequired=1` und NIEMALS eine `DOKUMENT` Variable im `variableSchema`.

**Begründung:**
- Der separate Upload-Schritt ermöglicht OCR-Prüfung und Relevanz-Check
- Der Dokument-Text wird korrekt im Splitscreen angezeigt
- Keine Duplikate im Formular

### 4.2 Superprompt-Erstellung
> **REGEL:** Im Superprompt-Text das Dokument als "das hochgeladene Dokument" oder "die bereitgestellte Datei" referenzieren, NICHT als `{{DOKUMENT}}` Variable.

**Beispiel (korrekt):**
```
Analysiere das hochgeladene Dokument und extrahiere folgende Informationen:
- Vertragsparteien
- Laufzeit
- Kündigungsfristen
```

**Beispiel (falsch):**
```
Analysiere {{DOKUMENT}} und extrahiere folgende Informationen:
```

### 4.3 Variable-Schema
> **REGEL:** Das `variableSchema` enthält NUR Benutzer-Eingabefelder (Text, Select, Textarea, etc.), KEINE Datei-Uploads.

**Erlaubte Typen:**
- `text` - Einzeiliges Textfeld
- `textarea` - Mehrzeiliges Textfeld
- `select` - Dropdown-Auswahl
- `multiselect` - Mehrfachauswahl
- `number` - Zahlenfeld
- `date` - Datumsfeld

**NICHT erlaubt:**
- `file` - Wird über separaten Upload-Schritt gehandhabt

---

## 5. Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `server/routers/metaprompt.ts` | Generator-Prompt, saveAsTemplate, DOKUMENT-Filterung |
| `client/src/pages/AdminTemplates.tsx` | Dialog-Größe, Tabs, Textareas |
| `scripts/fix-document-variables.mjs` | Einmaliges Fix-Script für bestehende Templates |
| `scripts/seed-plans.mjs` | Plan-Limits und Features |

---

## 6. Test-Checkliste

### Vor dem Release prüfen:
- [ ] SP-2026-001 (Vertrags Analyse) funktioniert mit Dokument-Upload
- [ ] SP-2026-003 (Bilanz Monat prüfen) zeigt Dokument im Splitscreen
- [ ] Neuer Superprompt erstellt keine DOKUMENT-Variable
- [ ] Template-Editor öffnet sich in voller Größe
- [ ] Superprompt-Textarea ist resizable

---

## 7. Rollback-Anweisungen

Falls Probleme auftreten, können die Änderungen rückgängig gemacht werden:

1. **Checkpoint wiederherstellen:**
   ```
   Version: c5db3256 (vor den Änderungen)
   ```

2. **DOKUMENT-Variable manuell wiederherstellen:**
   ```sql
   -- Falls nötig, DOKUMENT-Variable wieder hinzufügen
   UPDATE taskTemplates 
   SET variableSchema = JSON_ARRAY_APPEND(variableSchema, '$', 
     JSON_OBJECT('key', 'DOKUMENT', 'label', 'Dokument', 'type', 'file', 'required', true))
   WHERE id IN (150078, 150101, 150185, 240013);
   ```

---

**Ende der Dokumentation**
