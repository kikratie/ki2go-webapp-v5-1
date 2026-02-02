# Dashboard Funktionsprüfung - Kunden-Bereich

## Sidebar Navigation (User)

| Link | Route | Status | Anmerkung |
|------|-------|--------|-----------|
| Startseite | `/` | ✅ OK | Homepage |
| Dashboard | `/dashboard` | ✅ OK | User Dashboard |
| Neue Aufgabe | `/aufgaben` | ✅ OK | Tasks Seite |
| Meine Templates | `/meine-templates` | ✅ OK | MeineTemplates.tsx |
| Meine Dokumente | `/meine-dokumente` | ✅ OK | MeineDokumente.tsx |
| Verlauf | `/verlauf` | ✅ OK | Verlauf.tsx |
| Mein Abo | `/mein-abo` | ✅ OK | MeinAbo.tsx |

## Sidebar Navigation (Firmen-Admin)

| Link | Route | Status | Anmerkung |
|------|-------|--------|-----------|
| Firmen-Dashboard | `/firma/dashboard` | ✅ OK | CompanyDashboard.tsx |
| Nutzungs-Statistiken | `/firma/nutzung` | ⚠️ PRÜFEN | FirmaDashboard.tsx - existiert? |
| Mitarbeiter | `/firma/users` | ✅ OK | CompanyUsers.tsx |

## Dashboard Links (Dashboard.tsx)

| Link | Route | Status | Anmerkung |
|------|-------|--------|-----------|
| Neue Aufgabe | `/aufgaben` | ✅ OK | |
| Meine Templates | `/templates` | ❌ FALSCH | Sollte `/meine-templates` sein |
| Meine Dokumente | `/dokumente` | ❌ FALSCH | Sollte `/meine-dokumente` sein |
| Verlauf | `/verlauf` | ✅ OK | |
| Aufgabe ausführen | `/aufgabe/{slug}` | ✅ OK | TaskExecution.tsx |
| Ergebnis anzeigen | `/ergebnis/{id}` | ✅ OK | TaskResult.tsx |
| Radar | `/radar` | ❌ FEHLT | Route existiert nicht! |
| Admin-Dashboard | `/admin` | ✅ OK | Nur für Owner |

## Zu beheben

1. `/templates` → `/meine-templates` ändern
2. `/dokumente` → `/meine-dokumente` ändern
3. `/radar` Route hinzufügen oder Link entfernen
4. `/firma/nutzung` prüfen - FirmaDashboard.tsx existiert?
5. `/firma/stats` - CompanyStats.tsx existiert und Route ist da ✅

## Zurück-Navigation

- Alle Seiten verwenden DashboardLayout mit Sidebar → Zurück zum Dashboard immer möglich ✅
- Einzelne Aufgaben/Ergebnisse: Prüfen ob Zurück-Button vorhanden
