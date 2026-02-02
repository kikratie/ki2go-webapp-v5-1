# KI2GO Datenbank-Übersicht

Stand: 28. Januar 2026

---

## Übersicht aller Tabellen (35 Tabellen)

| Tabelle | Beschreibung | Anzahl Einträge |
|---------|--------------|-----------------|
| **users** | Benutzer | 3 |
| **organizations** | Firmen/Organisationen | 0 |
| **organizationMembers** | Mitgliedschaften | 0 |
| **categories** | Aufgaben-Kategorien | 4 |
| **businessAreas** | Unternehmensbereiche | 11 |
| **taskTemplates** | Aufgaben-Templates | 1 |
| **metapromptTemplates** | Metaprompt-Templates | 3 |
| **workflowExecutions** | Aufgaben-Ausführungen | 3 |
| **subscriptionPlans** | Abo-Pläne | 0 |
| **organizationSubscriptions** | Firmen-Abos | 0 |
| **organizationInvitations** | Einladungen | 0 |
| **creditTransactions** | Credit-Transaktionen | 0 |
| **processAuditLog** | Prozess-Protokoll | 0 |
| **documentUsage** | Dokument-Nutzung | 0 |
| **documents** | Hochgeladene Dokumente | 2 |
| **taskRequests** | Individuelle Anfragen | 1 |
| **workflowFeedback** | Aufgaben-Feedback | 0 |

---

## Detaillierte Tabelleninhalte

### 1. USERS (3 Einträge)

| id | name | email | role | organizationId |
|----|------|-------|------|----------------|
| 17 | Josef Hicka | josef@hicka.at | owner | NULL |
| 37 | Niaghi | Niaghi@winitec.at | user | NULL |
| 38 | Niaghi | niaghi@ki2go.io | user | NULL |

**Hinweis:** Alle User haben aktuell **keine Organisation** zugewiesen (`organizationId = NULL`).

---

### 2. ORGANIZATIONS (0 Einträge)

Noch keine Firmen registriert.

---

### 3. CATEGORIES (4 Einträge)

| id | slug | name |
|----|------|------|
| 1 | analysieren_pruefen | Analysieren & Prüfen |
| 2 | erstellen_generieren | Erstellen & Generieren |
| 3 | optimieren_verbessern | Optimieren & Verbessern |
| 4 | recherchieren_zusammenfassen | Recherchieren & Zusammenfassen |

---

### 4. BUSINESS AREAS (11 Einträge)

| id | slug | name |
|----|------|------|
| 1 | vertrieb | Vertrieb & Sales |
| 2 | marketing | Marketing & Kommunikation |
| 3 | finanzen | Finanzen & Controlling |
| 4 | recht | Recht & Compliance |
| 5 | hr | HR & Personal |
| 6 | produkt | Produkt & Innovation |
| 7 | management_strategie | Management & Strategie |
| 8 | customer_success | Customer Success |
| 9 | growth_leadgen | Growth & Lead-Gen |
| 10 | projektmanagement | Projektmanagement |
| 11 | operations | Operations & IT |

---

### 5. TASK TEMPLATES (1 Eintrag)

| id | name | title | category | businessArea |
|----|------|-------|----------|--------------|
| 4 | juristische_und_wirtschaftliche_pruefung_von_vertraegen | Juristische und wirtschaftliche Prüfung von Verträgen | Analysieren & Prüfen | Recht & Compliance |

**Variablen-Schema:**
- ANWENDUNGSFALL_BESCHREIBUNG_DURCH_DEN_USER (textarea, required)
- VERTRAGSTYP (select, required)
- RECHTSRAUM (select, required)
- ROLLEN_IM_VERTRAG (text, required)
- KRITISCHE_SCHWERPUNKTE (multiselect, required)
- OUTPUT_WUNSCH (select, required)

---

### 6. METAPROMPT TEMPLATES (3 Einträge)

| id | name | category | isActive |
|----|------|----------|----------|
| 1 | Analysieren & Prüfen Metaprompt | analysieren_pruefen | 1 |
| 2 | Erstellen & Generieren Metaprompt | erstellen_generieren | 1 |
| 3 | Optimieren & Verbessern Metaprompt | optimieren_verbessern | 1 |

---

### 7. WORKFLOW EXECUTIONS (3 Einträge)

| id | userId | templateId | status | inputTokens | outputTokens | totalCost |
|----|--------|------------|--------|-------------|--------------|-----------|
| 9 | 37 | 4 | completed | NULL | NULL | NULL |
| 10 | 37 | 4 | completed | NULL | NULL | NULL |
| 11 | 37 | 4 | completed | NULL | NULL | NULL |

**Hinweis:** Kosten-Tracking ist noch nicht aktiv - alle Token- und Kosten-Felder sind NULL.

---

### 8. DOCUMENTS (2 Einträge)

| id | userId | originalFileName | fileSize | mimeType |
|----|--------|------------------|----------|----------|
| 10 | 37 | Einkaufsbedingungen 2024 OCR.pdf | 188,584 bytes | application/pdf |
| 11 | 37 | Mietvertrag OCR.pdf | 346,516 bytes | application/pdf |

---

### 9. TASK REQUESTS (1 Eintrag)

| id | description | status | contactEmail | urgency |
|----|-------------|--------|--------------|---------|
| 1 | Bewerbungen/Lebensläufe abgleichen mit Stellenprofil | new | josef@hicka.at | urgent |

---

### 10. SUBSCRIPTION PLANS (0 Einträge)

Noch keine Abo-Pläne definiert.

---

### 11. ORGANIZATION SUBSCRIPTIONS (0 Einträge)

Noch keine Firmen-Abos aktiv.

---

### 12. PROCESS AUDIT LOG (0 Einträge)

Noch keine Prozesse protokolliert (Kosten-Tracking nicht aktiv).

---

## Wichtige Erkenntnisse

1. **User ohne Organisation:** Alle 3 User (inkl. Niaghi@winitec.at) haben keine Organisation zugewiesen.

2. **Kosten-Tracking nicht aktiv:** Die 3 Workflow-Ausführungen haben keine Token- oder Kosten-Daten.

3. **Keine Firmen registriert:** Das Onboarding-System wurde noch nicht genutzt.

4. **1 offene Anfrage:** Bewerbungs-Matching für josef@hicka.at (Status: new, urgent).

5. **2 Dokumente hochgeladen:** Von User 37 (Niaghi@winitec.at).

---

## Nächste Schritte

1. **Kosten-Tracking aktivieren:** Token-Verbrauch bei LLM-Aufrufen erfassen
2. **Test-Firma erstellen:** Onboarding-Flow testen
3. **User zu Organisation zuweisen:** Niaghi@winitec.at einer Firma zuordnen
