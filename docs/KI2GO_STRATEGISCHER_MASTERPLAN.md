# KI2GO - Strategischer Masterplan

## Manus-Unabhängigkeit, SaaS-Vollständigkeit & Integrations-Roadmap

**Erstellt am:** 31. Januar 2026  
**Version:** 1.0  
**Autor:** Manus AI für Josef  
**Status:** Editierbares Strategiedokument

---

## Inhaltsverzeichnis

1. [Executive Summary](#1-executive-summary)
2. [Teil A: Manus-Unabhängigkeit](#teil-a-manus-unabhängigkeit)
3. [Teil B: SaaS-Vollständigkeit](#teil-b-saas-vollständigkeit)
4. [Teil C: Integrations-Roadmap](#teil-c-integrations-roadmap)
5. [Teil D: Implementierungsplan](#teil-d-implementierungsplan)
6. [Anhang: Code-Referenzen](#anhang-code-referenzen)

---

## 1. Executive Summary

Dieses Dokument beschreibt den vollständigen Fahrplan, um KI2GO von einer Manus-gebundenen Anwendung zu einer **unabhängigen, skalierbaren SaaS-Plattform** zu entwickeln. Der Plan ist so konzipiert, dass Sie jederzeit zwischen Manus und alternativen Anbietern wechseln können.

### Kernziele

| Ziel | Beschreibung | Priorität |
|------|--------------|-----------|
| **Manus-Unabhängigkeit** | Switch zwischen Manus und eigenen Systemen | Hoch |
| **SaaS-Vollständigkeit** | Alle Features für ein profitables SaaS | Hoch |
| **Integrations-Fähigkeit** | Anbindung an externe Dienste | Mittel |
| **Skalierbarkeit** | Wachstum ohne Architektur-Umbau | Mittel |

---

## Teil A: Manus-Unabhängigkeit

### A.1 Aktuelle Manus-Abhängigkeiten

Die Code-Analyse hat **5 kritische Abhängigkeiten** identifiziert:

| Komponente | Datei | Abhängigkeit | Schwierigkeit |
|------------|-------|--------------|---------------|
| **1. Authentifizierung** | `server/_core/oauth.ts`, `sdk.ts` | Manus OAuth Server | 🔴 Hoch |
| **2. LLM/KI-Aufrufe** | `server/_core/llm.ts` | Manus Forge API | 🟡 Mittel |
| **3. Datei-Speicher** | `server/storage.ts` | Manus S3 Proxy | 🟡 Mittel |
| **4. Datenbank** | `drizzle/schema.ts` | Manus TiDB | 🟢 Niedrig |
| **5. Benachrichtigungen** | `server/_core/notification.ts` | Manus Notification | 🟢 Niedrig |

### A.2 Lösungsarchitektur: Provider-Abstraktionsschicht

**Konzept:** Anstatt die Manus-Abhängigkeiten zu entfernen, bauen wir eine **Abstraktionsschicht**, die zwischen verschiedenen Providern wechseln kann.

```
┌─────────────────────────────────────────────────────────────┐
│                      KI2GO Anwendung                        │
├─────────────────────────────────────────────────────────────┤
│                  Provider-Abstraktionsschicht               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  Auth   │  │   LLM   │  │ Storage │  │  Notifications  │ │
│  │Provider │  │Provider │  │Provider │  │    Provider     │ │
│  └────┬────┘  └────┬────┘  └────┬────┘  └───────┬─────────┘ │
├───────┼───────────┼───────────┼─────────────────┼───────────┤
│       │           │           │                 │           │
│  ┌────▼────┐ ┌────▼────┐ ┌────▼────┐     ┌─────▼─────┐     │
│  │  Manus  │ │  Manus  │ │  Manus  │     │   Manus   │     │
│  │  OAuth  │ │  Forge  │ │   S3    │     │  Notify   │     │
│  └─────────┘ └─────────┘ └─────────┘     └───────────┘     │
│       │           │           │                 │           │
│  ┌────▼────┐ ┌────▼────┐ ┌────▼────┐     ┌─────▼─────┐     │
│  │NextAuth │ │ OpenAI  │ │  AWS    │     │ SendGrid  │     │
│  │/Clerk   │ │ /Azure  │ │   S3    │     │ /Resend   │     │
│  └─────────┘ └─────────┘ └─────────┘     └───────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### A.3 Detaillierte Umbau-Anleitung pro Komponente

---

#### A.3.1 Authentifizierung (Auth Provider)

**Aktueller Stand:**
```typescript
// server/_core/sdk.ts - Zeile 27-29
const EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
const GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
// Verwendet: ENV.oAuthServerUrl (Manus OAuth)
```

**Lösung: Auth-Provider-Interface**

```typescript
// NEU: server/providers/auth/types.ts
export interface AuthProvider {
  name: string;
  
  // Login-URL generieren
  getLoginUrl(redirectUri: string): string;
  
  // Code gegen Token tauschen
  exchangeCodeForToken(code: string, state: string): Promise<TokenResponse>;
  
  // User-Info abrufen
  getUserInfo(accessToken: string): Promise<UserInfo>;
  
  // Session erstellen
  createSession(userId: string): Promise<string>;
  
  // Session verifizieren
  verifySession(token: string): Promise<SessionPayload | null>;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface UserInfo {
  id: string;
  email: string | null;
  name: string | null;
  avatar?: string;
}
```

**Implementierungen:**

| Provider | Datei | Beschreibung |
|----------|-------|--------------|
| Manus | `server/providers/auth/manus.ts` | Bestehende Logik extrahieren |
| NextAuth | `server/providers/auth/nextauth.ts` | Für eigenen Server |
| Clerk | `server/providers/auth/clerk.ts` | Managed Auth Service |

**Umschaltung via ENV:**
```bash
# .env
AUTH_PROVIDER=manus  # oder: nextauth, clerk
```

**Aufwand:** 3-5 Tage

---

#### A.3.2 LLM/KI-Aufrufe (LLM Provider)

**Aktueller Stand:**
```typescript
// server/_core/llm.ts - Zeile 212-215
const resolveApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";
```

**Lösung: LLM-Provider-Interface**

```typescript
// NEU: server/providers/llm/types.ts
export interface LLMProvider {
  name: string;
  
  // Chat-Completion aufrufen
  invoke(params: InvokeParams): Promise<InvokeResult>;
  
  // Modell-Liste abrufen
  listModels(): Promise<string[]>;
  
  // Kosten berechnen
  calculateCost(usage: TokenUsage): number;
}

export interface InvokeParams {
  messages: Message[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
  responseFormat?: ResponseFormat;
}
```

**Implementierungen:**

| Provider | Datei | API-Endpunkt |
|----------|-------|--------------|
| Manus Forge | `server/providers/llm/manus.ts` | `forge.manus.im/v1/chat/completions` |
| OpenAI | `server/providers/llm/openai.ts` | `api.openai.com/v1/chat/completions` |
| Azure OpenAI | `server/providers/llm/azure.ts` | `{resource}.openai.azure.com/...` |
| Anthropic | `server/providers/llm/anthropic.ts` | `api.anthropic.com/v1/messages` |
| Ollama (Self-hosted) | `server/providers/llm/ollama.ts` | `localhost:11434/api/chat` |

**Umschaltung via ENV:**
```bash
# .env
LLM_PROVIDER=manus  # oder: openai, azure, anthropic, ollama

# Provider-spezifische Keys
OPENAI_API_KEY=sk-...
AZURE_OPENAI_ENDPOINT=https://...
AZURE_OPENAI_KEY=...
ANTHROPIC_API_KEY=...
```

**Aufwand:** 2-3 Tage

---

#### A.3.3 Datei-Speicher (Storage Provider)

**Aktueller Stand:**
```typescript
// server/storage.ts - Zeile 8-18
function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  // Verwendet Manus S3 Proxy
}
```

**Lösung: Storage-Provider-Interface**

```typescript
// NEU: server/providers/storage/types.ts
export interface StorageProvider {
  name: string;
  
  // Datei hochladen
  put(key: string, data: Buffer | string, contentType?: string): Promise<StorageResult>;
  
  // Download-URL generieren
  getUrl(key: string, expiresIn?: number): Promise<string>;
  
  // Datei löschen
  delete(key: string): Promise<void>;
  
  // Datei-Liste abrufen
  list(prefix: string): Promise<StorageFile[]>;
}

export interface StorageResult {
  key: string;
  url: string;
  size?: number;
}
```

**Implementierungen:**

| Provider | Datei | Beschreibung |
|----------|-------|--------------|
| Manus S3 | `server/providers/storage/manus.ts` | Bestehende Logik |
| AWS S3 | `server/providers/storage/aws-s3.ts` | Direkt zu AWS |
| Cloudflare R2 | `server/providers/storage/r2.ts` | S3-kompatibel, günstiger |
| MinIO | `server/providers/storage/minio.ts` | Self-hosted S3 |

**Umschaltung via ENV:**
```bash
# .env
STORAGE_PROVIDER=manus  # oder: aws, r2, minio

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=ki2go-files
AWS_S3_REGION=eu-central-1
```

**Aufwand:** 1-2 Tage

---

#### A.3.4 Datenbank

**Aktueller Stand:**
- Verwendet MySQL/TiDB über `DATABASE_URL`
- Drizzle ORM als Abstraktionsschicht

**Gute Nachricht:** Die Datenbank ist bereits **weitgehend unabhängig**!

**Für eigenen Server benötigt:**
```bash
# .env
DATABASE_URL=mysql://user:pass@localhost:3306/ki2go
# oder PostgreSQL:
DATABASE_URL=postgresql://user:pass@localhost:5432/ki2go
```

**Aufwand:** 0.5 Tage (nur Migration testen)

---

#### A.3.5 Benachrichtigungen (Notification Provider)

**Aktueller Stand:**
```typescript
// server/_core/notification.ts - Zeile 16-24
const buildEndpointUrl = (baseUrl: string): string => {
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
```

**Lösung: Notification-Provider-Interface**

```typescript
// NEU: server/providers/notification/types.ts
export interface NotificationProvider {
  name: string;
  
  // E-Mail senden
  sendEmail(params: EmailParams): Promise<boolean>;
  
  // Push-Notification senden
  sendPush?(params: PushParams): Promise<boolean>;
  
  // In-App Notification
  sendInApp?(userId: number, params: InAppParams): Promise<boolean>;
}
```

**Implementierungen:**

| Provider | Datei | Beschreibung |
|----------|-------|--------------|
| Manus | `server/providers/notification/manus.ts` | Bestehend |
| SendGrid | `server/providers/notification/sendgrid.ts` | E-Mail Service |
| Resend | `server/providers/notification/resend.ts` | Moderner E-Mail Service |
| Nodemailer | `server/providers/notification/nodemailer.ts` | SMTP direkt |

**Aufwand:** 1 Tag

---

### A.4 Zusammenfassung: Manus-Unabhängigkeit

| Komponente | Aufwand | Priorität | Ergebnis |
|------------|---------|-----------|----------|
| Auth Provider | 3-5 Tage | 🔴 Hoch | Switch zwischen Manus/NextAuth/Clerk |
| LLM Provider | 2-3 Tage | 🔴 Hoch | Switch zwischen Manus/OpenAI/Azure |
| Storage Provider | 1-2 Tage | 🟡 Mittel | Switch zwischen Manus/AWS/R2 |
| Database | 0.5 Tage | 🟢 Niedrig | Bereits flexibel |
| Notification | 1 Tag | 🟢 Niedrig | Switch zwischen Manus/SendGrid |
| **GESAMT** | **8-12 Tage** | | **Vollständige Unabhängigkeit** |

---

## Teil B: SaaS-Vollständigkeit

### B.1 Was fehlt für ein profitables SaaS?

| Feature | Status | Priorität | Beschreibung |
|---------|--------|-----------|--------------|
| **Zahlungssystem** | ❌ Fehlt | 🔴 Kritisch | Stripe-Integration |
| **Subscription-Management** | ⚠️ Teilweise | 🔴 Kritisch | Upgrade/Downgrade/Kündigung |
| **Rechnungsstellung** | ❌ Fehlt | 🔴 Kritisch | Automatische Rechnungen |
| **Customer Management** | ⚠️ Teilweise | 🟡 Wichtig | Dashboard für Owner |
| **E-Mail-System** | ❌ Fehlt | 🟡 Wichtig | Transaktionale E-Mails |
| **Onboarding-Flow** | ✅ Vorhanden | 🟢 OK | Profil-Vervollständigung |
| **Multi-Tenant** | ✅ Vorhanden | 🟢 OK | Organisationen |
| **Berechtigungen** | ✅ Vorhanden | 🟢 OK | Rollen-System |
| **Usage-Tracking** | ✅ Vorhanden | 🟢 OK | Nutzungsstatistiken |
| **Audit-Log** | ✅ Vorhanden | 🟢 OK | Protokollierung |

### B.2 Kritische Features im Detail

---

#### B.2.1 Zahlungssystem (Stripe)

**Was wird benötigt:**

```typescript
// Stripe-Integration Komponenten
1. Checkout-Session erstellen (für neue Abos)
2. Customer-Portal (für Abo-Verwaltung)
3. Webhooks (für Zahlungs-Events)
4. Subscription-Sync (DB mit Stripe synchron halten)
```

**Manus bietet bereits:** `webdev_add_feature` mit `feature="stripe"`

**Stripe-Flow:**
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Kunde      │────▶│   KI2GO      │────▶│   Stripe     │
│   wählt      │     │   erstellt   │     │   Checkout   │
│   Plan       │     │   Session    │     │   Page       │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
┌──────────────┐     ┌──────────────┐     ┌──────▼───────┐
│   Abo        │◀────│   Webhook    │◀────│   Zahlung    │
│   aktiviert  │     │   empfangen  │     │   erfolgt    │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Aufwand:** 2-3 Tage (mit Manus-Feature)

---

#### B.2.2 E-Mail-System

**Benötigte E-Mails:**

| E-Mail-Typ | Auslöser | Priorität |
|------------|----------|-----------|
| Willkommen | Nach Registrierung | 🔴 Hoch |
| Abo-Bestätigung | Nach Zahlung | 🔴 Hoch |
| Rechnung | Monatlich | 🔴 Hoch |
| Passwort-Reset | Auf Anfrage | 🟡 Mittel |
| Nutzungs-Report | Wöchentlich/Monatlich | 🟢 Niedrig |
| Abo-Erinnerung | Vor Ablauf | 🟡 Mittel |

**Lösung:** E-Mail-Provider in Notification-System integrieren

**Aufwand:** 2-3 Tage

---

#### B.2.3 Rechnungsstellung

**Optionen:**

| Option | Beschreibung | Aufwand |
|--------|--------------|---------|
| **Stripe Invoicing** | Stripe erstellt Rechnungen automatisch | Minimal |
| **Eigene Rechnungen** | PDF-Generierung mit Firmenlogo | 2-3 Tage |
| **Buchhaltungs-Export** | DATEV/BMD-kompatibel | 1-2 Tage |

**Empfehlung:** Stripe Invoicing + optionaler PDF-Export

---

### B.3 SaaS-Feature-Matrix

| Feature | Starter | Business | Enterprise |
|---------|---------|----------|------------|
| Aufgaben/Monat | 50 | 200 | Unbegrenzt |
| Custom Templates | 2 | 10 | Unbegrenzt |
| Team-Mitglieder | 1 | 5 | Unbegrenzt |
| Speicherplatz | 100 MB | 1 GB | 10 GB |
| Support | E-Mail | Priorität | Dediziert |
| API-Zugang | ❌ | ✅ | ✅ |
| White-Label | ❌ | ❌ | ✅ |
| **Preis/Monat** | €29 | €99 | €299+ |

---

## Teil C: Integrations-Roadmap

### C.1 Übersicht aller geplanten Integrationen

```
┌─────────────────────────────────────────────────────────────────┐
│                         KI2GO                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   ZAHLUNG   │  │    E-MAIL   │  │   SPEICHER  │             │
│  │   Stripe    │  │  SendGrid   │  │   Google    │             │
│  │   PayPal    │  │   Resend    │  │   OneDrive  │             │
│  │   Klarna    │  │  Mailchimp  │  │   Dropbox   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │     CRM     │  │  KALENDER   │  │  DOKUMENTE  │             │
│  │  Salesforce │  │   Google    │  │   Google    │             │
│  │   HubSpot   │  │  Outlook    │  │   Office    │             │
│  │   Pipedrive │  │   Cal.com   │  │   Notion    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    CHAT     │  │  ANALYTICS  │  │     API     │             │
│  │   Slack     │  │   Google    │  │   REST      │             │
│  │   Teams     │  │   Mixpanel  │  │   GraphQL   │             │
│  │   Discord   │  │   Plausible │  │   Webhooks  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### C.2 Integrations-Details

---

#### C.2.1 Zahlungsdienstleister

| Anbieter | Zweck | Aufwand | Priorität |
|----------|-------|---------|-----------|
| **Stripe** | Haupt-Zahlungssystem | 2-3 Tage | 🔴 Kritisch |
| PayPal | Alternative Zahlung | 1-2 Tage | 🟡 Mittel |
| Klarna | Ratenzahlung | 1 Tag | 🟢 Später |

**Stripe-Integration:**
```typescript
// Benötigte Endpunkte
POST /api/stripe/create-checkout    // Checkout starten
POST /api/stripe/webhook            // Events empfangen
GET  /api/stripe/portal             // Kunden-Portal
GET  /api/stripe/subscription       // Abo-Status
```

---

#### C.2.2 E-Mail-Systeme

| Anbieter | Zweck | Aufwand | Priorität |
|----------|-------|---------|-----------|
| **SendGrid** | Transaktionale E-Mails | 1-2 Tage | 🔴 Kritisch |
| Resend | Modern, Developer-friendly | 1 Tag | 🟡 Alternative |
| Mailchimp | Marketing-E-Mails | 1-2 Tage | 🟢 Später |

**E-Mail-Templates benötigt:**
```
1. welcome.html          - Willkommens-E-Mail
2. subscription.html     - Abo-Bestätigung
3. invoice.html          - Rechnung
4. password-reset.html   - Passwort zurücksetzen
5. usage-report.html     - Nutzungsbericht
6. reminder.html         - Abo-Erinnerung
```

---

#### C.2.3 Cloud-Speicher (Google Drive, OneDrive)

| Anbieter | Zweck | Aufwand | Priorität |
|----------|-------|---------|-----------|
| **Google Drive** | Dokumente importieren/exportieren | 2-3 Tage | 🟡 Wichtig |
| **OneDrive** | Microsoft-Integration | 2-3 Tage | 🟡 Wichtig |
| Dropbox | Alternative | 1-2 Tage | 🟢 Später |

**Use Cases:**
```
1. Dokument aus Google Drive importieren → KI2GO analysiert
2. KI2GO-Ergebnis nach Google Drive exportieren
3. Automatische Synchronisation von Ordnern
```

---

#### C.2.4 Microsoft 365 Integration

| Feature | Beschreibung | Aufwand |
|---------|--------------|---------|
| **OneDrive** | Datei-Zugriff | 2 Tage |
| **Outlook** | Kalender-Integration | 2 Tage |
| **Teams** | Benachrichtigungen | 1-2 Tage |
| **Word/Excel** | Dokument-Export | 1 Tag |

**Microsoft Graph API:**
```typescript
// Benötigte Scopes
- Files.ReadWrite.All     // OneDrive
- Calendars.ReadWrite     // Outlook Kalender
- ChannelMessage.Send     // Teams
- User.Read               // Benutzer-Info
```

---

#### C.2.5 CRM-Systeme

| Anbieter | Zweck | Aufwand | Priorität |
|----------|-------|---------|-----------|
| HubSpot | Lead-Tracking | 2-3 Tage | 🟢 Später |
| Salesforce | Enterprise-CRM | 3-5 Tage | 🟢 Später |
| Pipedrive | Sales-Pipeline | 1-2 Tage | 🟢 Später |

**Use Case:** Neue KI2GO-Kunden automatisch ins CRM übertragen

---

#### C.2.6 Eigene API (für externe Programme)

**Das ist Phase 4 aus der vorherigen Analyse!**

| Feature | Beschreibung | Aufwand |
|---------|--------------|---------|
| **API-Keys** | Authentifizierung | 2 Tage |
| **Rate-Limiting** | Schutz vor Missbrauch | 1 Tag |
| **REST-Endpunkte** | Aufgaben ausführen | 3-5 Tage |
| **Webhooks** | Events an externe Systeme | 2 Tage |
| **Dokumentation** | OpenAPI/Swagger | 1-2 Tage |

**API-Endpunkte:**
```
POST /api/v1/tasks/execute     - Aufgabe ausführen
GET  /api/v1/tasks             - Aufgaben-Liste
GET  /api/v1/tasks/:id/result  - Ergebnis abrufen
GET  /api/v1/usage             - Nutzungsstatistiken
POST /api/v1/webhooks          - Webhook registrieren
```

---

### C.3 Integrations-Prioritäten

| Phase | Integrationen | Zeitraum | Business-Impact |
|-------|---------------|----------|-----------------|
| **Phase 1** | Stripe, SendGrid | Woche 1-2 | 💰 Umsatz ermöglichen |
| **Phase 2** | Google Drive, OneDrive | Woche 3-4 | 📈 Produktivität steigern |
| **Phase 3** | Microsoft 365 | Woche 5-6 | 🏢 Enterprise-Kunden |
| **Phase 4** | Eigene API | Woche 7-8 | 🔗 Automatisierung |
| **Phase 5** | CRM, Slack, Teams | Woche 9+ | 🚀 Ecosystem |

---

## Teil D: Implementierungsplan

### D.1 Gesamtübersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                    KI2GO ROADMAP 2026                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FEBRUAR          MÄRZ            APRIL           MAI           │
│  ────────         ────────        ────────        ────────      │
│                                                                 │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐   │
│  │ Stripe  │     │ Provider│     │ Google  │     │  API    │   │
│  │ E-Mail  │     │ Abstrak-│     │ OneDrive│     │ Zugang  │   │
│  │ Kunden- │     │ tion    │     │ MS 365  │     │ Webhooks│   │
│  │ Mgmt    │     │         │     │         │     │         │   │
│  └─────────┘     └─────────┘     └─────────┘     └─────────┘   │
│                                                                 │
│  💰 Umsatz        🔄 Flexibel     📈 Features     🔗 Ecosystem  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### D.2 Detaillierter Sprint-Plan

---

#### Sprint 1: SaaS-Grundlagen (Woche 1-2)

| Tag | Aufgabe | Ergebnis |
|-----|---------|----------|
| 1-2 | Stripe-Integration aktivieren | Checkout funktioniert |
| 3 | Webhook-Handler implementieren | Zahlungen werden verarbeitet |
| 4-5 | Subscription-Sync | DB spiegelt Stripe-Status |
| 6-7 | E-Mail-System (SendGrid) | Willkommens-E-Mail funktioniert |
| 8-9 | Customer Management Dashboard | Owner sieht alle Kunden |
| 10 | Testing & Bugfixes | Alles stabil |

**Deliverables:**
- [ ] Stripe Checkout funktioniert
- [ ] Webhooks verarbeiten Zahlungen
- [ ] E-Mails werden versendet
- [ ] Kunden-Dashboard zeigt alle Daten

---

#### Sprint 2: Provider-Abstraktion (Woche 3-4)

| Tag | Aufgabe | Ergebnis |
|-----|---------|----------|
| 1-2 | Auth-Provider-Interface | Struktur steht |
| 3-4 | LLM-Provider-Interface | OpenAI-Alternative möglich |
| 5-6 | Storage-Provider-Interface | AWS S3 möglich |
| 7-8 | Notification-Provider | SendGrid direkt nutzbar |
| 9-10 | Testing & Dokumentation | Alles getestet |

**Deliverables:**
- [ ] Switch zwischen Manus/OpenAI möglich
- [ ] Switch zwischen Manus S3/AWS S3 möglich
- [ ] Dokumentation für Provider-Wechsel

---

#### Sprint 3: Cloud-Integrationen (Woche 5-6)

| Tag | Aufgabe | Ergebnis |
|-----|---------|----------|
| 1-3 | Google Drive Integration | Import/Export funktioniert |
| 4-6 | OneDrive Integration | Microsoft-Anbindung |
| 7-8 | Microsoft 365 OAuth | Login mit Microsoft |
| 9-10 | Testing & UI | Benutzerfreundlich |

**Deliverables:**
- [ ] Dokumente aus Google Drive importieren
- [ ] Ergebnisse nach OneDrive exportieren
- [ ] Microsoft-Login möglich

---

#### Sprint 4: API & Automatisierung (Woche 7-8)

| Tag | Aufgabe | Ergebnis |
|-----|---------|----------|
| 1-2 | API-Key-System | Keys generieren/verwalten |
| 3-4 | REST-API-Endpunkte | Aufgaben via API ausführen |
| 5-6 | Rate-Limiting | Schutz vor Missbrauch |
| 7-8 | Webhooks | Events an externe Systeme |
| 9-10 | API-Dokumentation | Swagger/OpenAPI |

**Deliverables:**
- [ ] API-Keys können erstellt werden
- [ ] Aufgaben via API ausführbar
- [ ] Webhook-System funktioniert
- [ ] Dokumentation verfügbar

---

### D.3 Ressourcen-Schätzung

| Phase | Aufwand | Kosten (geschätzt) |
|-------|---------|-------------------|
| Sprint 1: SaaS-Grundlagen | 2 Wochen | Entwicklungszeit |
| Sprint 2: Provider-Abstraktion | 2 Wochen | Entwicklungszeit |
| Sprint 3: Cloud-Integrationen | 2 Wochen | + API-Kosten |
| Sprint 4: API & Automatisierung | 2 Wochen | Entwicklungszeit |
| **GESAMT** | **8 Wochen** | |

**Externe Kosten (monatlich):**

| Service | Kosten | Notwendig ab |
|---------|--------|--------------|
| Stripe | 1.4% + €0.25/Transaktion | Sofort |
| SendGrid | $0-20/Monat | Sofort |
| OpenAI API | ~$0.01-0.03/1K Tokens | Bei Wechsel |
| AWS S3 | ~$5-20/Monat | Bei Wechsel |
| Google Cloud | ~$0-10/Monat | Bei Integration |

---

## Anhang: Code-Referenzen

### Aktuelle Manus-Abhängigkeiten im Code

| Datei | Zeilen | Abhängigkeit |
|-------|--------|--------------|
| `server/_core/env.ts` | 8-9 | `forgeApiUrl`, `forgeApiKey` |
| `server/_core/llm.ts` | 212-215 | Manus Forge API URL |
| `server/_core/sdk.ts` | 27-29 | Manus OAuth Endpunkte |
| `server/_core/oauth.ts` | 23-24 | Manus Token Exchange |
| `server/storage.ts` | 8-18 | Manus S3 Proxy |
| `server/_core/notification.ts` | 16-24 | Manus Notification Service |

### Neue Dateien für Provider-System

```
server/providers/
├── index.ts                    # Provider-Registry
├── auth/
│   ├── types.ts               # Interface
│   ├── manus.ts               # Manus OAuth
│   ├── nextauth.ts            # NextAuth.js
│   └── clerk.ts               # Clerk
├── llm/
│   ├── types.ts               # Interface
│   ├── manus.ts               # Manus Forge
│   ├── openai.ts              # OpenAI
│   ├── azure.ts               # Azure OpenAI
│   └── anthropic.ts           # Anthropic Claude
├── storage/
│   ├── types.ts               # Interface
│   ├── manus.ts               # Manus S3
│   ├── aws-s3.ts              # AWS S3
│   └── r2.ts                  # Cloudflare R2
└── notification/
    ├── types.ts               # Interface
    ├── manus.ts               # Manus Notify
    ├── sendgrid.ts            # SendGrid
    └── resend.ts              # Resend
```

---

## Checkliste für Josef

### Sofort starten (Diese Woche)

- [ ] Stripe-Integration aktivieren (`webdev_add_feature`)
- [ ] Customer Management Dashboard bauen
- [ ] E-Mail-Templates vorbereiten

### Kurzfristig (Februar)

- [ ] SendGrid-Account erstellen
- [ ] Stripe-Account einrichten
- [ ] Erste zahlende Kunden gewinnen

### Mittelfristig (März-April)

- [ ] Provider-Abstraktionsschicht implementieren
- [ ] Google Drive Integration
- [ ] Microsoft 365 Integration

### Langfristig (Mai+)

- [ ] Eigene API veröffentlichen
- [ ] CRM-Integrationen
- [ ] White-Label für Enterprise

---

**Dieses Dokument ist editierbar und sollte regelmäßig aktualisiert werden, wenn sich Prioritäten ändern oder neue Anforderungen entstehen.**

---

*Erstellt von Manus AI | Version 1.0 | 31. Januar 2026*
