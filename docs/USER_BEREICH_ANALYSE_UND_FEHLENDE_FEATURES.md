# KI2GO User-Bereich: Vollständige Analyse & Fehlende Features

**Erstellt:** 31. Januar 2026  
**Autor:** Manus AI  
**Version:** 1.0

---

## Executive Summary

Diese Analyse untersucht den aktuellen User-Bereich von KI2GO und identifiziert alle fehlenden Features für ein vollständiges SaaS-Erlebnis. Die Untersuchung zeigt, dass die **Datenbank-Struktur bereits sehr gut vorbereitet** ist (Subscriptions, Credits, Invitations), aber viele **Frontend-Seiten fehlen**, um diese Funktionen für User zugänglich zu machen.

---

## 1. Aktuelle Situation

### 1.1 Vorhandene User-Seiten

| Seite | Pfad | Funktion | Status |
|-------|------|----------|--------|
| Dashboard | `/dashboard` | Übersicht, KPIs | ✅ Vorhanden |
| Neue Aufgabe | `/aufgaben` | Task-Auswahl | ✅ Vorhanden |
| Meine Templates | `/meine-templates` | Template-Übersicht | ✅ Vorhanden |
| Meine Dokumente | `/meine-dokumente` | Dokument-Verwaltung | ✅ Vorhanden |
| Verlauf | `/verlauf` | Ausführungs-Historie | ✅ Vorhanden |
| Profil | `/profile` | Persönliche Daten | ✅ Vorhanden |

### 1.2 Vorhandene Firmen-Admin-Seiten

| Seite | Pfad | Funktion | Status |
|-------|------|----------|--------|
| Firmen-Dashboard | `/firma/dashboard` | Firmen-Übersicht | ✅ Vorhanden |
| Nutzungs-Statistiken | `/firma/nutzung` | Usage-Analytics | ✅ Vorhanden |
| Mitarbeiter | `/firma/users` | User-Verwaltung | ✅ Vorhanden |

### 1.3 Datenbank-Tabellen (bereits vorhanden)

Die folgenden Tabellen existieren bereits und sind **bereit für Frontend-Integration**:

| Tabelle | Zweck | Frontend-Seite vorhanden? |
|---------|-------|---------------------------|
| `subscriptionPlans` | Abo-Pakete (Basic/Pro/Enterprise) | ❌ NEIN |
| `organizationSubscriptions` | Aktive Abos pro Firma | ❌ NEIN |
| `creditTransactions` | Credit-Verbrauch & -Gutschriften | ❌ NEIN |
| `organizationInvitations` | Einladungs-Codes | ⚠️ Teilweise |
| `workflowFeedback` | Bewertungen & Verbesserungen | ❌ NEIN |

---

## 2. Fehlende Features (Kritisch)

### 2.1 Abrechnung & Finanzen

**Was fehlt komplett:**

| Feature | Beschreibung | Priorität |
|---------|--------------|-----------|
| **Mein Abo** | User sieht sein aktuelles Paket, Limits, Ablaufdatum | 🔴 Kritisch |
| **Rechnungen** | Übersicht aller Rechnungen, PDF-Download | 🔴 Kritisch |
| **Zahlungsmethode** | Kreditkarte/SEPA hinterlegen (Stripe) | 🔴 Kritisch |
| **Upgrade/Downgrade** | Paket wechseln | 🔴 Kritisch |
| **Credit-Übersicht** | Wie viele Credits noch übrig? | 🔴 Kritisch |
| **Verbrauchshistorie** | Wann wurden wie viele Credits verbraucht? | 🟡 Wichtig |

**Empfohlene Seiten:**

```
/mein-abo              → Abo-Übersicht, Paket, Limits
/mein-abo/rechnungen   → Rechnungs-Historie
/mein-abo/zahlung      → Zahlungsmethode verwalten
/mein-abo/upgrade      → Paket wechseln
```

### 2.2 Mitarbeiter-Verwaltung (für Firmen-Admins)

**Was teilweise fehlt:**

| Feature | Beschreibung | Status |
|---------|--------------|--------|
| Mitarbeiter einladen | Einladungs-Link generieren | ⚠️ Backend vorhanden, Frontend unvollständig |
| Einladungs-Codes verwalten | Aktive Codes sehen, widerrufen | ❌ Fehlt |
| Rollen zuweisen | Admin/Member Rolle ändern | ⚠️ Teilweise |
| Mitarbeiter entfernen | Aus Firma entfernen | ⚠️ Teilweise |
| Abteilung zuweisen | Kategorie/Bereich zuweisen | ❌ Fehlt |

**Empfohlene Erweiterungen für `/firma/users`:**

- Einladungs-Dialog mit Code-Generierung
- Tabelle mit aktiven Einladungs-Codes
- Dropdown für Abteilungs-Zuweisung

### 2.3 Benachrichtigungen & Kommunikation

**Was fehlt komplett:**

| Feature | Beschreibung | Priorität |
|---------|--------------|-----------|
| **Benachrichtigungs-Center** | Alle Meldungen an einem Ort | 🟡 Wichtig |
| **E-Mail-Einstellungen** | Welche Mails erhalten? | 🟡 Wichtig |
| **Abo-Warnungen** | "Ihr Abo läuft in 7 Tagen ab" | 🔴 Kritisch |
| **Credit-Warnungen** | "Nur noch 10% Credits übrig" | 🔴 Kritisch |

---

## 3. Fehlende Features (Wichtig)

### 3.1 Erweiterte User-Funktionen

| Feature | Beschreibung | Priorität |
|---------|--------------|-----------|
| **Favoriten** | Häufig genutzte Templates anpinnen | 🟡 Wichtig |
| **Schnellstart** | Top 5 meistgenutzte Aufgaben | 🟡 Wichtig |
| **Letzte Aktivität** | Timeline der letzten Aktionen | 🟢 Nice-to-have |
| **Export-Center** | Alle Ergebnisse als ZIP exportieren | 🟡 Wichtig |

### 3.2 Feedback & Support

| Feature | Beschreibung | Priorität |
|---------|--------------|-----------|
| **Feedback geben** | Bewertung nach jeder Aufgabe | ⚠️ Teilweise vorhanden |
| **Support-Anfrage** | Ticket erstellen | 🟡 Wichtig |
| **FAQ / Hilfe** | Häufige Fragen | 🟢 Nice-to-have |

### 3.3 Firmen-Admin Erweiterungen

| Feature | Beschreibung | Priorität |
|---------|--------------|-----------|
| **Team-Templates** | Eigene Templates für die Firma | 🟡 Wichtig |
| **Nutzungs-Limits** | Limits pro Mitarbeiter setzen | 🟢 Nice-to-have |
| **Aktivitäts-Report** | Wer hat was gemacht? | 🟡 Wichtig |
| **Kosten-Prognose** | "Bei aktuellem Verbrauch: €X/Monat" | 🟡 Wichtig |

---

## 4. Empfohlene Navigation (User-Bereich)

### 4.1 Neue Struktur mit Gruppen

```
📊 ARBEITEN
   → Neue Aufgabe
   → Meine Templates
   → Schnellstart (Top 5)
   → Favoriten

📁 MEINE DATEN
   → Meine Dokumente
   → Verlauf
   → Ergebnisse exportieren

💳 MEIN ABO
   → Übersicht & Credits
   → Rechnungen
   → Paket wechseln

⚙️ EINSTELLUNGEN
   → Profil
   → Benachrichtigungen
   → Hilfe & Support
```

### 4.2 Zusätzlich für Firmen-Admins

```
🏢 FIRMA
   → Firmen-Dashboard
   → Mitarbeiter verwalten
   → Einladungen
   → Nutzungs-Statistiken
   → Team-Templates
   → Kosten & Abrechnung
```

---

## 5. Implementierungs-Roadmap

### Phase 1: Kritische Features (Woche 1-2)

| Feature | Aufwand | Abhängigkeit |
|---------|---------|--------------|
| Mein Abo (Übersicht) | 1 Tag | - |
| Credit-Anzeige | 0.5 Tage | - |
| Stripe-Integration | 2-3 Tage | `webdev_add_feature` |
| Rechnungs-Übersicht | 1 Tag | Stripe |
| Abo-Warnungen | 0.5 Tage | - |

### Phase 2: Mitarbeiter-Verwaltung (Woche 2-3)

| Feature | Aufwand | Abhängigkeit |
|---------|---------|--------------|
| Einladungs-Dialog verbessern | 1 Tag | - |
| Einladungs-Codes verwalten | 0.5 Tage | - |
| Abteilungs-Zuweisung | 0.5 Tage | Schema bereits vorhanden |
| Rollen-Management | 0.5 Tage | - |

### Phase 3: User-Experience (Woche 3-4)

| Feature | Aufwand | Abhängigkeit |
|---------|---------|--------------|
| User-Navigation mit Gruppen | 1 Tag | - |
| Favoriten-System | 1 Tag | - |
| Schnellstart | 0.5 Tage | - |
| Benachrichtigungs-Center | 1 Tag | - |

### Phase 4: Erweiterte Features (Woche 4+)

| Feature | Aufwand | Abhängigkeit |
|---------|---------|--------------|
| Export-Center | 1 Tag | - |
| Team-Templates | 2 Tage | - |
| Aktivitäts-Report | 1 Tag | - |
| Support-System | 1-2 Tage | - |

---

## 6. Zusammenfassung

### Was bereits gut funktioniert ✅

- Datenbank-Schema ist vollständig vorbereitet
- Subscription-System (Backend) existiert
- Credit-Tracking (Backend) existiert
- Einladungs-System (Backend) existiert
- Usage-Tracking funktioniert

### Was dringend fehlt ❌

| Bereich | Fehlende Seiten |
|---------|-----------------|
| **Abrechnung** | Mein Abo, Rechnungen, Zahlungsmethode, Upgrade |
| **Credits** | Credit-Übersicht, Verbrauchshistorie |
| **Einladungen** | Einladungs-Verwaltung (Frontend) |
| **Benachrichtigungen** | Notification-Center, E-Mail-Einstellungen |

### Empfohlene Priorität

1. **Sofort:** Stripe-Integration aktivieren
2. **Diese Woche:** Mein Abo Seite, Credit-Anzeige
3. **Nächste Woche:** Einladungs-Verwaltung verbessern
4. **Danach:** User-Navigation optimieren, Favoriten

---

## 7. Nächste Schritte

1. **Stripe aktivieren** mit `webdev_add_feature`
2. **Mein Abo Seite** erstellen (`/mein-abo`)
3. **Credit-Widget** im Dashboard hinzufügen
4. **Einladungs-Dialog** in `/firma/users` verbessern
5. **User-Navigation** mit Gruppen implementieren

---

*Dieses Dokument dient als Grundlage für die weitere Entwicklung des User-Bereichs von KI2GO.*
