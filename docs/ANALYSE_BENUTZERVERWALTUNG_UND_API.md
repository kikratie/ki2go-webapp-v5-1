# KI2GO WebApp V5 - Analyse: Benutzerverwaltung, API-Infrastruktur und Risikobewertung

**Erstellt am:** 31. Januar 2026  
**Version:** 1.0  
**Autor:** Manus AI

---

## Zusammenfassung

Diese Analyse dokumentiert den aktuellen Stand der Benutzerverwaltung, API-Infrastruktur und bewertet die Risiken bei der Implementierung eines erweiterten Customer Management Dashboards. Die Untersuchung zeigt, dass bereits eine solide Grundstruktur existiert, die als Basis für die geplanten Erweiterungen dienen kann.

---

## 1. Aktuelle Benutzer-Hierarchie

### 1.1 Implementierte Rollen

Die aktuelle Implementierung verwendet ein dreistufiges Rollensystem auf Plattform-Ebene sowie ein separates Rollensystem auf Organisations-Ebene:

| Rolle | Ebene | Beschreibung | Berechtigungen |
|-------|-------|--------------|----------------|
| **Owner** | Plattform | Plattform-Eigentümer (Sie) | Vollzugriff auf alle Funktionen, Kunden, Kosten |
| **Admin** | Plattform | Plattform-Administrator | Erweiterte Verwaltungsrechte |
| **User** | Plattform | Standard-Benutzer | Basis-Funktionen, eigene Aufgaben |
| **owner** | Organisation | Firmen-Eigentümer | Vollzugriff auf Firmen-Funktionen |
| **admin** | Organisation | Firmen-Administrator | Mitarbeiter-Verwaltung, Nutzungsstatistiken |
| **member** | Organisation | Firmen-Mitarbeiter | Aufgaben-Ausführung, eigene Dokumente |

### 1.2 Datenbank-Schema für Benutzer

Die `users`-Tabelle enthält folgende relevante Felder:

```typescript
users = {
  id: int,
  openId: varchar(64),           // Manus OAuth ID
  name: text,
  email: varchar(320),
  role: enum["user", "admin", "owner"],  // Plattform-Rolle
  status: enum["active", "suspended", "deleted"],
  userType: enum["business", "private"],
  organizationId: int,           // Zugehörige Organisation
  profileCompleted: int,
  // ... weitere Profil-Felder
}
```

### 1.3 Organisations-Struktur

Jeder Kunde (Firma) wird als `organization` abgebildet:

```typescript
organizations = {
  id: int,
  name: varchar(255),
  slug: varchar(255),
  ownerId: int,                  // User-ID des Firmen-Eigentümers
  customerNumber: varchar(20),   // Format: K[Jahr]-[Nr] z.B. K2026-001
  industry: varchar(255),
  employeeCount: int,
  // ...
}

organizationMembers = {
  organizationId: int,
  userId: int,
  role: enum["owner", "admin", "member"],  // Organisations-Rolle
  joinedAt: timestamp,
}
```

---

## 2. Vorhandene Admin-Funktionen

### 2.1 User-Router (`server/routers/user.ts`)

Der User-Router bietet bereits umfangreiche Verwaltungsfunktionen:

| Funktion | Beschreibung | Zugriff |
|----------|--------------|---------|
| `user.list` | Alle Benutzer auflisten mit Suche, Filter, Paginierung | Owner |
| `user.getById` | Einzelnen Benutzer mit Statistiken laden | Owner |
| `user.setStatus` | Status ändern (active/suspended/deleted) | Owner |
| `user.setRole` | Rolle ändern (user/admin) | Owner |
| `user.delete` | Soft- oder Hard-Delete (DSGVO-konform) | Owner |
| `user.assignOrganization` | Benutzer einer Organisation zuweisen | Owner |
| `user.exportMyData` | DSGVO-Datenexport für eigenen Account | User |

### 2.2 Audit-Router (`server/routers/audit.ts`)

Der Audit-Router bietet Überwachungs- und Analysefunktionen:

| Funktion | Beschreibung | Zugriff |
|----------|--------------|---------|
| `audit.getOrganizations` | Alle Firmen mit Mitgliedern, Subscription, Kosten | Owner |
| `audit.getUsers` | Alle User mit Statistiken | Owner |
| `audit.getProcessLog` | Vollständiges Prozess-Protokoll | Owner |
| `audit.createOrganization` | Neue Organisation erstellen | Owner |
| `audit.updateOrganization` | Organisation bearbeiten | Owner |
| `audit.extendSubscription` | Subscription verlängern | Owner |

### 2.3 Owner-Dashboard-Router (`server/routers/ownerDashboard.ts`)

Speziell für Kosten-Überwachung:

| Funktion | Beschreibung | Zugriff |
|----------|--------------|---------|
| `ownerDashboard.getManusKosten` | Gesamt-Manus-Kosten | Owner/Admin |
| `ownerDashboard.getKundenKosten` | Kosten pro Kunde/Organisation | Owner/Admin |
| `ownerDashboard.getKostenTrend` | Kosten-Trend (12 Monate) | Owner/Admin |
| `ownerDashboard.getUserNutzung` | Einzelne User-Nutzung | Owner/Admin |
| `ownerDashboard.getAllUsersNutzung` | Alle User mit Nutzung | Owner/Admin |

### 2.4 Firma-Dashboard-Router (`server/routers/firmaDashboard.ts`)

Für Firmen-Administratoren:

| Funktion | Beschreibung | Zugriff |
|----------|--------------|---------|
| `firmaDashboard.checkAccess` | Prüfe Admin-Berechtigung | Protected |
| `firmaDashboard.getKpis` | KPI-Übersicht der Firma | Firmen-Admin |
| `firmaDashboard.getMemberStats` | Mitarbeiter-Statistiken | Firmen-Admin |
| `firmaDashboard.getTrends` | Nutzungs-Trends (6 Monate) | Firmen-Admin |
| `firmaDashboard.getTopTemplates` | Meistgenutzte Templates | Firmen-Admin |
| `firmaDashboard.exportCsv` | CSV-Export der Nutzung | Firmen-Admin |

---

## 3. Vorhandene Frontend-Seiten

### 3.1 Admin-Bereich (Owner/Admin)

| Route | Komponente | Funktion |
|-------|------------|----------|
| `/admin` | Admin.tsx | Admin-Dashboard Übersicht |
| `/admin/all-users` | AdminUsers.tsx | Benutzer-Verwaltung |
| `/admin/organizations` | AdminOrganizations.tsx | Firmen-Verwaltung |
| `/admin/templates` | AdminTemplates.tsx | Owner-Templates |
| `/admin/custom-templates` | AdminCustomTemplates.tsx | Custom-Templates |
| `/admin/cost-analytics` | AdminCostAnalytics.tsx | Kosten-Analyse |
| `/admin/manus-kosten` | OwnerKosten.tsx | Manus-Kosten-Übersicht |
| `/admin/process-log` | AdminProcessLog.tsx | Prozess-Protokoll |
| `/admin/realtime` | AdminRealtimeDashboard.tsx | Echtzeit-Dashboard |
| `/admin/change-requests` | AdminChangeRequests.tsx | Änderungsanfragen |

### 3.2 Firmen-Bereich (Firmen-Admin)

| Route | Komponente | Funktion |
|-------|------------|----------|
| `/firma/dashboard` | CompanyDashboard.tsx | Firmen-Übersicht |
| `/firma/nutzung` | FirmaDashboard.tsx | Nutzungsstatistiken |
| `/firma/users` | CompanyUsers.tsx | Mitarbeiter-Verwaltung |

---

## 4. API-Infrastruktur

### 4.1 Aktueller API-Status

Die Anwendung verwendet **tRPC** als API-Framework. Alle Endpunkte sind unter `/api/trpc/*` erreichbar.

**Wichtig:** Es existiert derzeit **keine separate REST-API** für externe Zugriffe. Alle Funktionen sind ausschließlich über die tRPC-Schnittstelle verfügbar, die primär für die interne Frontend-Kommunikation konzipiert ist.

### 4.2 Authentifizierung

Die Authentifizierung erfolgt über **Manus OAuth**:

- Session-basierte Authentifizierung via Cookies
- `publicProcedure`: Öffentlich zugängliche Endpunkte
- `protectedProcedure`: Erfordert Anmeldung
- `ownerOnlyProcedure`: Nur für Owner-Rolle
- `adminProcedure`: Für Owner oder Admin

### 4.3 Vorhandene Router

```
server/routers/
├── audit.ts              # Audit & Überwachung
├── businessArea.ts       # Unternehmensbereiche
├── category.ts           # Kategorien
├── customSuperprompt.ts  # Custom-Templates
├── dashboard.ts          # Dashboard-Daten
├── document.ts           # Dokument-Upload
├── documents.ts          # Dokument-Verwaltung
├── export.ts             # Export-Funktionen
├── firmaDashboard.ts     # Firmen-Dashboard
├── metaprompt.ts         # Metaprompt-Verwaltung
├── myTemplates.ts        # Eigene Templates
├── onboarding.ts         # Onboarding-Prozess
├── organization.ts       # Organisations-Verwaltung
├── ownerDashboard.ts     # Owner-Kosten-Dashboard
├── subscription.ts       # Subscriptions
├── taskRequest.ts        # Aufgaben-Anfragen
├── template.ts           # Owner-Templates
├── user.ts               # Benutzer-Verwaltung
└── workflow.ts           # Workflow-Ausführung
```

---

## 5. Geplante Erweiterungen - Analyse

### 5.1 Erweiterte Benutzer-Hierarchie

Die vorgeschlagene erweiterte Hierarchie umfasst:

| Neue Rolle | Beschreibung | Empfehlung |
|------------|--------------|------------|
| **Kunden-Admin** | Kann eigene User anlegen | **Empfohlen** - Bereits als `organizationMembers.role = "admin"` vorhanden |
| **Abteilungen** | Gruppierung innerhalb Firmen | **Später** - Erfordert neue Tabelle `teams` (bereits im Schema) |
| **Demo-User** | Zeitlich begrenzte Test-Accounts | **Später** - Über `userSubscriptions.status = "trial"` abbildbar |
| **API-User** | Programmatischer Zugriff | **Später** - Erfordert API-Key-System |

### 5.2 Customer Management Dashboard

Für ein umfassendes Kunden-Dashboard werden folgende Daten benötigt:

| Datenpunkt | Status | Quelle |
|------------|--------|--------|
| Kundenliste | ✅ Vorhanden | `audit.getOrganizations` |
| Nutzungsstatistiken | ✅ Vorhanden | `usageTracking`-Tabelle |
| Aktivierte Aufgaben | ✅ Vorhanden | `organizationTemplates`-Tabelle |
| Custom-Templates | ✅ Vorhanden | `customSuperprompts`-Tabelle |
| Credits/Kosten | ✅ Vorhanden | `workflowExecutions.estimatedCost` |
| Aktivitäts-Log | ✅ Vorhanden | `processAuditLog`-Tabelle |
| Subscription-Status | ✅ Vorhanden | `organizationSubscriptions`-Tabelle |

---

## 6. Risikobewertung

### 6.1 Risiko-Matrix

| Risiko | Wahrscheinlichkeit | Auswirkung | Gesamtrisiko | Mitigation |
|--------|-------------------|------------|--------------|------------|
| Datenbank-Migration bricht bestehende Daten | Niedrig | Hoch | **Mittel** | Backup vor Migration, schrittweise Änderungen |
| Performance-Probleme bei großen Datenmengen | Mittel | Mittel | **Mittel** | Indizes prüfen, Paginierung nutzen |
| Berechtigungsfehler bei neuen Rollen | Mittel | Hoch | **Hoch** | Umfangreiche Tests, schrittweise Einführung |
| Inkompatibilität mit bestehenden Frontend-Komponenten | Niedrig | Niedrig | **Niedrig** | Bestehende Komponenten wiederverwenden |
| DSGVO-Compliance bei erweiterten Daten | Mittel | Hoch | **Hoch** | Datenschutz-Review, Consent-Tracking |

### 6.2 Detaillierte Risiko-Analyse

#### 6.2.1 Berechtigungssystem (Hohes Risiko)

**Risiko:** Die Einführung neuer Rollen (Kunden-Admin, API-User) könnte zu Berechtigungslücken führen.

**Bestehende Absicherung:**
- `ownerOnlyProcedure` und `adminProcedure` sind bereits implementiert
- Organisations-Rollen (`owner`, `admin`, `member`) existieren bereits

**Empfehlung:**
1. Neue Rollen als Erweiterung der bestehenden Enum-Werte implementieren
2. Middleware-basierte Berechtigungsprüfung beibehalten
3. Unit-Tests für alle Berechtigungsszenarien erstellen

#### 6.2.2 Datenbank-Änderungen (Mittleres Risiko)

**Risiko:** Schema-Änderungen könnten bestehende Daten beschädigen.

**Bestehende Absicherung:**
- Drizzle ORM mit Migrations-System
- Versionierte Schema-Dateien

**Empfehlung:**
1. Nur additive Änderungen (neue Spalten, Tabellen)
2. Keine Löschung oder Umbenennung bestehender Felder
3. Checkpoint vor jeder Migration erstellen

#### 6.2.3 API-Erweiterung (Niedriges Risiko)

**Risiko:** Neue API-Endpunkte könnten bestehende Funktionalität beeinträchtigen.

**Bestehende Absicherung:**
- tRPC-Router sind modular aufgebaut
- Jeder Router ist unabhängig testbar

**Empfehlung:**
1. Neue Funktionen in separaten Routern implementieren
2. Bestehende Router nicht modifizieren, nur erweitern
3. Vitest-Tests für alle neuen Endpunkte

---

## 7. Empfohlene Implementierungsreihenfolge

### Phase 1: Customer Management Dashboard (Niedrig-Risiko)

**Ziel:** Übersichtliche Darstellung aller Kundendaten an einem Ort

**Aufgaben:**
1. Neue Admin-Seite `/admin/kunden` erstellen
2. Bestehende APIs nutzen (`audit.getOrganizations`, `ownerDashboard.getKundenKosten`)
3. Detailansicht pro Kunde mit:
   - Aktivierte Templates
   - Nutzungsstatistiken
   - Custom-Templates
   - Mitarbeiter-Liste
   - Kosten-Übersicht

**Risiko:** Niedrig (nur Frontend-Änderungen)

### Phase 2: Kunden-Admin Funktionen (Mittel-Risiko)

**Ziel:** Firmen-Admins können eigene Mitarbeiter verwalten

**Aufgaben:**
1. Bestehende `organizationMembers.role = "admin"` nutzen
2. Frontend `/firma/users` erweitern für Einladungen
3. Einladungs-System ist bereits implementiert (`organizationInvitations`)

**Risiko:** Mittel (Berechtigungsprüfung erforderlich)

### Phase 3: Abteilungen/Teams (Mittel-Risiko)

**Ziel:** Gruppierung von Mitarbeitern innerhalb einer Firma

**Aufgaben:**
1. `teams`-Tabelle ist bereits im Schema vorhanden
2. Team-Zuweisung für Mitarbeiter implementieren
3. Template-Freigaben auf Team-Ebene ermöglichen

**Risiko:** Mittel (neue Logik, aber auf bestehender Struktur)

### Phase 4: API-Zugang (Höheres Risiko)

**Ziel:** Programmatischer Zugriff für Integrationen

**Aufgaben:**
1. API-Key-System implementieren (neue Tabelle)
2. Rate-Limiting einführen
3. Separate REST-API-Endpunkte erstellen
4. Dokumentation erstellen

**Risiko:** Höher (Sicherheitsrelevant, neue Infrastruktur)

---

## 8. Technische Empfehlungen

### 8.1 Für das Customer Management Dashboard

```typescript
// Empfohlene neue Route in server/routers/customerManagement.ts
export const customerManagementRouter = router({
  // Kunden-Übersicht mit allen relevanten Daten
  getCustomerOverview: ownerOnlyProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      // Kombiniert Daten aus:
      // - organizations
      // - organizationMembers
      // - organizationTemplates
      // - customSuperprompts
      // - usageTracking
      // - workflowExecutions
    }),
    
  // Aktivierte Templates pro Kunde
  getActivatedTemplates: ownerOnlyProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      // Aus organizationTemplates + taskTemplates
    }),
    
  // Custom-Templates pro Kunde
  getCustomTemplates: ownerOnlyProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      // Aus customSuperprompts
    }),
});
```

### 8.2 Für Berechtigungsprüfung

```typescript
// Empfohlene Middleware-Erweiterung
const customerAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  // Prüfe ob User Firmen-Admin ist
  if (!ctx.user.organizationId) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  // Prüfe Organisations-Rolle
  // ...
  return next({ ctx });
});
```

---

## 9. Fazit

Die bestehende Codebase bietet eine **solide Grundlage** für die geplanten Erweiterungen:

**Stärken:**
- Modulare Router-Architektur ermöglicht einfache Erweiterungen
- Umfangreiches Datenbank-Schema bereits vorhanden
- Berechtigungssystem ist implementiert und erweiterbar
- Audit-Logging und Kosten-Tracking existieren bereits

**Handlungsbedarf:**
- Customer Management Dashboard als neue Seite erstellen
- Bestehende APIs für Kunden-Übersicht kombinieren
- Schrittweise Einführung neuer Rollen

**Risikobewertung:** Die Implementierung ist mit **mittlerem Risiko** verbunden, da die meisten benötigten Strukturen bereits existieren. Die größten Risiken liegen in der Berechtigungsverwaltung und sollten durch umfangreiche Tests abgesichert werden.

---

## Anhang: Vorhandene Datenbank-Tabellen

| Tabelle | Zweck | Relevant für |
|---------|-------|--------------|
| `users` | Benutzer-Stammdaten | Benutzerverwaltung |
| `organizations` | Firmen/Mandanten | Kundenverwaltung |
| `organizationMembers` | Firmen-Mitgliedschaften | Berechtigungen |
| `organizationTemplates` | Template-Freigaben | Aktivierte Aufgaben |
| `customSuperprompts` | Kundenspezifische Templates | Custom-Templates |
| `usageTracking` | Nutzungsstatistiken | Verbrauchsübersicht |
| `workflowExecutions` | Ausführungs-Log | Aktivitäts-Tracking |
| `processAuditLog` | Vollständiges Audit-Log | Compliance |
| `adminAuditLog` | Admin-Aktionen | Nachvollziehbarkeit |
| `organizationSubscriptions` | Abonnements | Subscription-Status |
| `userSubscriptions` | User-Abonnements | Plan-Verwaltung |
| `plans` | Preispläne | Paket-Definitionen |
| `teams` | Abteilungen (vorbereitet) | Zukünftige Erweiterung |
| `organizationInvitations` | Einladungs-Codes | Mitarbeiter-Onboarding |

---

*Dieses Dokument wurde automatisch erstellt und sollte vor der Implementierung mit dem Entwicklungsteam abgestimmt werden.*
