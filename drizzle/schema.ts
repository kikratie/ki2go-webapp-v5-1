import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

// ==================== USERS & AUTH ====================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "owner"]).default("user").notNull(),
  // Status: active, suspended, deleted
  status: mysqlEnum("status", ["active", "suspended", "deleted"]).default("active").notNull(),
  // User-Typ: Unternehmen oder Privatperson
  userType: mysqlEnum("userType", ["business", "private"]).default("business"),
  // Profil-Felder
  companyName: varchar("companyName", { length: 255 }),
  position: varchar("position", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  country: varchar("country", { length: 100 }).default("Österreich"),
  industry: varchar("industry", { length: 255 }),
  howFound: varchar("howFound", { length: 255 }),
  // Consent-Tracking
  termsAcceptedAt: timestamp("termsAcceptedAt"),
  privacyAcceptedAt: timestamp("privacyAcceptedAt"),
  profileCompleted: int("profileCompleted").default(0),
  // Onboarding & Benachrichtigungen
  hasCompletedOnboarding: int("hasCompletedOnboarding").default(0),
  emailNotificationsEnabled: int("emailNotificationsEnabled").default(1),
  // Bestehende Felder
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }).default("50.00"),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  organizationId: int("organizationId"),
  // Abteilungs-Zuweisung (nutzt bestehende Kategorien & Unternehmensbereiche)
  categoryId: int("categoryId"), // Welche Aufgaben-Kategorie (z.B. "Analysieren & Prüfen")
  businessAreaId: int("businessAreaId"), // Welcher Unternehmensbereich (z.B. "HR & Recruiting")
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== ORGANIZATIONS & TEAMS ====================

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique(),
  ownerId: int("ownerId").notNull(),
  
  // Kundennummer im Format K[Jahr]-[fortlaufend] z.B. K2026-001
  customerNumber: varchar("customerNumber", { length: 20 }).unique(),
  
  logoUrl: varchar("logoUrl", { length: 500 }), // Firmenlogo URL
  industry: varchar("industry", { length: 255 }), // Branche
  employeeCount: int("employeeCount"), // Mitarbeiteranzahl
  settings: text("settings"), // JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const organizationMembers = mysqlTable("organizationMembers", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("memberRole", ["owner", "admin", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== CATEGORIES (Editierbar) ====================

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // z.B. "analysieren_pruefen"
  name: varchar("name", { length: 255 }).notNull(), // z.B. "Analysieren & Prüfen"
  description: text("description"),
  icon: varchar("icon", { length: 100 }), // Lucide Icon Name
  color: varchar("color", { length: 20 }), // z.B. "#5FBDCE"
  displayOrder: int("displayOrder").default(0),
  isActive: int("isActive").default(1),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ==================== BUSINESS AREAS (Editierbar) ====================

export const businessAreas = mysqlTable("businessAreas", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // z.B. "sales_vertrieb"
  name: varchar("name", { length: 255 }).notNull(), // z.B. "Sales & Vertrieb"
  description: text("description"),
  icon: varchar("icon", { length: 100 }), // Lucide Icon Name
  displayOrder: int("displayOrder").default(0),
  isActive: int("isActive").default(1),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessArea = typeof businessAreas.$inferSelect;
export type InsertBusinessArea = typeof businessAreas.$inferInsert;

// ==================== METAPROMPT TEMPLATES ====================

// Legacy enums für Abwärtskompatibilität (werden durch Tabellen ersetzt)
export const categoryEnum = mysqlEnum("category", [
  "analysieren_pruefen",
  "erstellen_kreieren", 
  "schreiben_verfassen",
  "recherche_suche",
  "uebersetzen_umwandeln",
  "vergleichen_zusammenfassen",
  "zusammenfassen_erklaeren",
  "planen_organisieren"
]);

export const businessAreaEnum = mysqlEnum("businessArea", [
  "sales_vertrieb",
  "marketing_pr",
  "legal_recht",
  "hr_recruiting",
  "einkauf_finanzen",
  "management_strategie",
  "customer_success",
  "growth_leadgen",
  "bid_management",
  "projektmanagement",
  "operations"
]);

export const metapromptTemplates = mysqlTable("metapromptTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  template: text("template").notNull(), // Der METAPROMPT mit {{VARIABLEN}}
  version: int("version").default(1),
  isActive: int("isActive").default(1),
  isDefault: int("isDefault").default(0), // Nur ein Template kann Standard sein
  category: categoryEnum,
  businessArea: businessAreaEnum,
  // Erweiterte Einstellungen für Generator
  targetAudience: text("targetAudience"), // Zielgruppe für generierte Prompts
  outputStyle: varchar("outputStyle", { length: 100 }), // z.B. "formal", "conversational"
  
  // Autor-Tracking (Pflichtfelder für Qualitätssicherung)
  createdByName: varchar("createdByName", { length: 255 }), // Name des Erstellers (Pflichtfeld)
  lastModifiedByName: varchar("lastModifiedByName", { length: 255 }), // Name des letzten Bearbeiters
  versionLabel: varchar("versionLabel", { length: 20 }).default("1.0"), // Versionsnummer z.B. "1.0", "1.1"
  changeLog: text("changeLog"), // Beschreibung der Änderungen
  
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MetapromptTemplate = typeof metapromptTemplates.$inferSelect;

// ==================== SUPERPROMPT COLLECTION ====================

export const superpromptCollection = mysqlTable("superpromptCollection", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  userQuery: text("userQuery"), // Original-Anfrage
  recognizedIntent: varchar("recognizedIntent", { length: 255 }),
  category: categoryEnum,
  businessArea: businessAreaEnum,
  metapromptTemplateId: int("metapromptTemplateId"),
  generatedSuperprompt: text("generatedSuperprompt"),
  variableSchema: text("variableSchema"), // JSON: [{ name, type, label, required }]
  variableValues: text("variableValues"), // JSON: { VARIABLE_NAME: value }
  smartAnswers: text("smartAnswers"), // JSON: KI-generierte Antworten
  llmResult: text("llmResult"),
  llmModel: varchar("llmModel", { length: 100 }),
  llmTemperature: decimal("llmTemperature", { precision: 3, scale: 2 }),
  llmCost: decimal("llmCost", { precision: 10, scale: 4 }),
  executionTime: int("executionTime"), // Millisekunden
  rating: decimal("rating", { precision: 3, scale: 2 }),
  usageCount: int("usageCount").default(0),
  embedding: text("embedding"), // JSON: Embedding-Vektor
  isCurated: int("isCurated").default(0),
  slug: varchar("slug", { length: 255 }),
  title: varchar("title", { length: 255 }),
  shortDescription: text("shortDescription"),
  icon: varchar("icon", { length: 100 }),
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Superprompt = typeof superpromptCollection.$inferSelect;

// ==================== DOCUMENTS ====================

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  originalFileName: varchar("originalFileName", { length: 255 }),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 500 }),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  extractedText: text("extractedText"),
  pageCount: int("pageCount"),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  embedding: text("embedding"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;

// ==================== WORKFLOW TRACKING ====================

export const workflowProtocols = mysqlTable("workflowProtocols", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 255 }),
  workflowType: varchar("workflowType", { length: 100 }),
  userQuery: text("userQuery"),
  recognizedIntent: varchar("recognizedIntent", { length: 255 }),
  category: categoryEnum,
  businessArea: businessAreaEnum,
  metapromptTemplate: text("metapromptTemplate"),
  generatedSuperprompt: text("generatedSuperprompt"),
  variableSchema: text("variableSchema"),
  variableValues: text("variableValues"),
  smartAnswers: text("smartAnswers"),
  documentId: int("documentId"),
  llmModel: varchar("llmModel", { length: 100 }),
  llmTemperature: decimal("llmTemperature", { precision: 3, scale: 2 }),
  llmResult: text("llmResult"),
  executionTime: int("executionTime"),
  cost: decimal("cost", { precision: 10, scale: 4 }),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  feedback: text("feedback"),
  status: mysqlEnum("workflowStatus", ["started", "in_progress", "completed", "failed"]).default("started"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type WorkflowProtocol = typeof workflowProtocols.$inferSelect;

// ==================== ANALYTICS ====================

export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 255 }),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  eventCategory: varchar("eventCategory", { length: 100 }),
  eventAction: varchar("eventAction", { length: 255 }),
  eventLabel: varchar("eventLabel", { length: 255 }),
  eventValue: decimal("eventValue", { precision: 10, scale: 2 }),
  metadata: text("metadata"), // JSON
  pageUrl: text("pageUrl"),
  referrer: text("referrer"),
  userAgent: text("userAgent"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const llmUsage = mysqlTable("llmUsage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  workflowProtocolId: int("workflowProtocolId"),
  model: varchar("model", { length: 100 }).notNull(),
  promptTokens: int("promptTokens"),
  completionTokens: int("completionTokens"),
  totalTokens: int("totalTokens"),
  cost: decimal("cost", { precision: 10, scale: 6 }),
  latency: int("latency"), // ms
  success: int("success").default(1),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== RESEARCH QUERIES (Geschäftsführer-Radar) ====================

export const researchQueries = mysqlTable("researchQueries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  organizationId: int("organizationId"),
  query: text("query").notNull(),
  queryEmbedding: text("queryEmbedding"),
  clusterId: int("clusterId"),
  clusterName: varchar("clusterName", { length: 255 }),
  resultSummary: text("resultSummary"),
  sourcesCount: int("sourcesCount"),
  duration: int("duration"), // ms
  requestedAsTask: int("requestedAsTask").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const researchClusters = mysqlTable("researchClusters", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  queryCount: int("queryCount").default(0),
  uniqueUsers: int("uniqueUsers").default(0),
  isUpsellOpportunity: int("isUpsellOpportunity").default(0),
  status: mysqlEnum("clusterStatus", ["open", "in_progress", "implemented", "rejected"]).default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== TASK TEMPLATES (Admin-verwaltete Aufgaben) ====================

export const taskTemplates = mysqlTable("taskTemplates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Grunddaten (Tab 1)
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(), // Interner Name
  title: varchar("title", { length: 255 }).notNull(), // Anzeigename
  description: text("description"),
  shortDescription: varchar("shortDescription", { length: 500 }),
  
  // Kategorisierung
  categoryId: int("categoryId"), // Referenz auf categories Tabelle
  businessAreaId: int("businessAreaId"), // Referenz auf businessAreas Tabelle
  
  // Visuell
  icon: varchar("icon", { length: 100 }).default("FileText"),
  color: varchar("color", { length: 20 }),
  
  // Variablen-Schema (Tab 2) - JSON Array
  // Format: [{ key: string, label: string, type: 'text'|'textarea'|'number'|'select'|'file', required: boolean, placeholder?: string, options?: string[], helpText?: string, fileTypes?: string[], maxFileSize?: number }]
  variableSchema: json("variableSchema").$type<Array<{
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'file' | 'multiselect' | 'date';
    required: boolean;
    placeholder?: string;
    options?: string[];
    helpText?: string;
    fileTypes?: string[];
    maxFileSize?: number;
    defaultValue?: string;
    displayOrder?: number;
  }>>(),
  
  // Superprompt (Tab 3)
  superprompt: text("superprompt"), // Der Prompt mit {{variablen}}
  superpromptVersion: int("superpromptVersion").default(1),
  
  // Erweiterte Einstellungen (Tab 4)
  estimatedTimeSavings: int("estimatedTimeSavings"), // Minuten
  creditCost: int("creditCost").default(1),
  llmModel: varchar("llmModel", { length: 100 }),
  llmTemperature: decimal("llmTemperature", { precision: 3, scale: 2 }).default("0.7"),
  maxTokens: int("maxTokens"),
  outputFormat: mysqlEnum("outputFormat", ["markdown", "json", "text", "html"]).default("markdown"),
  exampleOutput: text("exampleOutput"),
  
  // Dokument-Anforderungen
  documentRequired: int("documentRequired").default(0), // Ist Dokument-Upload erforderlich?
  documentCount: int("documentCount").default(1), // Anzahl erlaubter Dokumente (1-10)
  allowedFileTypes: json("allowedFileTypes").$type<string[]>(), // z.B. ["pdf", "docx"]
  maxFileSize: int("maxFileSize").default(10485760), // 10 MB default
  maxPages: int("maxPages"), // Maximale Seitenzahl (für PDFs)
  documentRelevanceCheck: int("documentRelevanceCheck").default(0), // Prüft System ob Dokument passt?
  documentDescription: text("documentDescription"), // Beschreibung welches Dokument erwartet wird
  
  // Masking-Einstellungen
  maskingRequired: int("maskingRequired").default(0), // Soll Masking angeboten werden?
  maskingTypes: json("maskingTypes").$type<string[]>(), // z.B. ["names", "addresses", "bankdata"]
  autoMasking: int("autoMasking").default(0), // Automatisches Masking ohne Nachfrage?
  
  // Keywords für automatisches Matching
  keywords: json("keywords").$type<string[]>(), // z.B. ["vertrag", "prüfen", "analyse"]
  
  // Status & Sortierung
  status: mysqlEnum("templateStatus", ["draft", "active", "archived"]).default("draft"),
  displayOrder: int("displayOrder").default(0),
  isFeatured: int("isFeatured").default(0), // Auf Homepage hervorheben
  isPublic: int("isPublic").default(0), // Für alle User zugänglich (ohne Organisations-Freigabe)
  
  // Nutzungsstatistiken
  usageCount: int("usageCount").default(0),
  avgRating: decimal("avgRating", { precision: 3, scale: 2 }),
  
  // Audit & Protokoll
  // Owner-Template ID im Format OT-[fortlaufend]-V[Version] z.B. "OT-042-V1"
  uniqueId: varchar("uniqueId", { length: 50 }),
  creationMethod: mysqlEnum("creationMethod", ["generator", "manual", "import"]).default("manual"), // Wie wurde das Template erstellt?
  sourceMetapromptId: int("sourceMetapromptId"), // Welches Metaprompt wurde verwendet (bei Generator)
  
  // Autor-Tracking (Pflichtfelder für Qualitätssicherung)
  createdByName: varchar("createdByName", { length: 255 }), // Name des Erstellers (Pflichtfeld)
  lastModifiedByName: varchar("lastModifiedByName", { length: 255 }), // Name des letzten Bearbeiters
  templateVersion: varchar("templateVersion", { length: 20 }).default("1.0"), // Versionsnummer z.B. "1.0", "1.1", "2.0"
  changeLog: text("changeLog"), // Beschreibung der Änderungen
  
  // ROI-Kalkulation (editierbar)
  roiBaseTimeMinutes: int("roiBaseTimeMinutes").default(30), // Basis-Zeitaufwand manuell (ohne Dokumente)
  roiTimePerDocumentMinutes: int("roiTimePerDocumentMinutes").default(15), // Zusätzliche Zeit pro Dokument
  roiKi2goTimeMinutes: int("roiKi2goTimeMinutes").default(3), // KI2GO Bearbeitungszeit (Basis)
  roiKi2goTimePerDocument: int("roiKi2goTimePerDocument").default(1), // KI2GO Zeit pro zusätzliches Dokument
  roiHourlyRate: int("roiHourlyRate").default(80), // Standard-Stundensatz in Euro
  roiTasksPerMonth: int("roiTasksPerMonth").default(10), // Aufgaben pro Monat für Jahresersparnis-Berechnung
  roiSources: json("roiSources").$type<{ name: string; url: string; finding: string }[]>(), // Quellenangaben für ROI-Werte
  
  // Marketing & SEO (für Aufgaben-Seite)
  marketingEnabled: int("marketingEnabled").default(0), // Marketing-Banner anzeigen ja/nein
  marketingHeadline: varchar("marketingHeadline", { length: 100 }), // SEO-optimierte Headline
  marketingSubheadline: varchar("marketingSubheadline", { length: 200 }), // Nutzenversprechen
  marketingUsps: json("marketingUsps").$type<string[]>(), // 3-4 USP-Punkte als Array
  marketingCtaText: varchar("marketingCtaText", { length: 50 }), // Call-to-Action Button Text
  marketingMetaDescription: varchar("marketingMetaDescription", { length: 160 }), // SEO Meta-Description
  marketingKeywords: json("marketingKeywords").$type<string[]>(), // SEO Keywords
  
  // Disclaimer (rechtlicher Hinweis für Ergebnisse)
  disclaimer: text("disclaimer"), // Individueller Disclaimer für diese Aufgabe
  
  createdBy: int("createdBy"),
  updatedBy: int("updatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = typeof taskTemplates.$inferInsert;

// Superprompt-Versionen (für Versionierung)
export const superpromptVersions = mysqlTable("superpromptVersions", {
  id: int("id").autoincrement().primaryKey(),
  taskTemplateId: int("taskTemplateId").notNull(),
  version: int("version").notNull(),
  superprompt: text("superprompt").notNull(),
  variableSchema: json("variableSchema"),
  changeNote: text("changeNote"),
  isDefault: int("isDefault").default(0),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SuperpromptVersion = typeof superpromptVersions.$inferSelect;

// ==================== FEEDBACK ====================

export const superpromptFeedback = mysqlTable("superpromptFeedback", {
  id: int("id").autoincrement().primaryKey(),
  superpromptId: int("superpromptId").notNull(),
  userId: int("userId").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  comment: text("comment"),
  feedbackType: mysqlEnum("feedbackType", ["helpful", "confusing", "missing", "unnecessary"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const variableFeedback = mysqlTable("variableFeedback", {
  id: int("id").autoincrement().primaryKey(),
  superpromptId: int("superpromptId").notNull(),
  userId: int("userId").notNull(),
  variableName: varchar("variableName", { length: 255 }).notNull(),
  feedbackType: mysqlEnum("varFeedbackType", ["helpful", "confusing", "missing", "unnecessary"]),
  comment: text("comment"),
  upvotes: int("upvotes").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== SYSTEM SETTINGS ====================

export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 255 }).notNull().unique(),
  settingValue: text("settingValue"),
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ==================== ADMIN LOGS ====================

export const adminLogs = mysqlTable("adminLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  targetType: varchar("targetType", { length: 100 }),
  targetId: int("targetId"),
  changes: text("changes"), // JSON
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== FALLBACK SUGGESTIONS ====================

export const fallbackSuggestions = mysqlTable("fallbackSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  exampleQuery: text("exampleQuery"),
  category: categoryEnum,
  businessArea: businessAreaEnum,
  icon: varchar("icon", { length: 100 }),
  isActive: int("isActive").default(1),
  displayOrder: int("displayOrder").default(0),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ==================== ORGANIZATION TEMPLATES (Multi-Tenant Template-Freigabe) ====================

export const organizationTemplates = mysqlTable("organizationTemplates", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  templateId: int("templateId").notNull(), // Referenz auf taskTemplates
  isActive: int("isActive").default(1),
  customSettings: text("customSettings"), // JSON für org-spezifische Anpassungen
  assignedBy: int("assignedBy"),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type OrganizationTemplate = typeof organizationTemplates.$inferSelect;

// ==================== WORKFLOW EXECUTIONS (Aufgaben-Ausführungen) ====================

export const workflowExecutions = mysqlTable("workflowExecutions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Referenzen
  userId: int("userId").notNull(),
  organizationId: int("organizationId"),
  templateId: int("templateId").notNull(), // Welches Template wurde ausgeführt
  
  // Session
  sessionId: varchar("sessionId", { length: 100 }).notNull(), // Eindeutige Session-ID
  
  // Input-Daten
  variableValues: json("variableValues").$type<Record<string, any>>(), // Eingegebene Variablen
  documentIds: json("documentIds").$type<number[]>(), // Hochgeladene Dokumente
  
  // Ausführung
  superpromptUsed: text("superpromptUsed"), // Der tatsächlich verwendete Prompt (mit eingesetzten Variablen)
  llmModel: varchar("llmModel", { length: 100 }),
  llmTemperature: decimal("llmTemperature", { precision: 3, scale: 2 }),
  
  // Ergebnis
  result: text("result"), // Das KI-Ergebnis
  resultFormat: mysqlEnum("resultFormat", ["markdown", "json", "text", "html"]).default("markdown"),
  
  // Metriken
  promptTokens: int("promptTokens"),
  completionTokens: int("completionTokens"),
  totalTokens: int("totalTokens"),
  executionTimeMs: int("executionTimeMs"),
  estimatedCost: decimal("estimatedCost", { precision: 10, scale: 6 }),
  
  // Status
  status: mysqlEnum("executionStatus", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending"),
  errorMessage: text("errorMessage"),
  
  // Zeitstempel
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;

// ==================== WORKFLOW FEEDBACK (Bewertungen & Verbesserungsvorschläge) ====================

export const workflowFeedback = mysqlTable("workflowFeedback", {
  id: int("id").autoincrement().primaryKey(),
  
  // Referenzen
  executionId: int("executionId").notNull(), // Referenz auf workflowExecutions
  userId: int("userId").notNull(),
  organizationId: int("organizationId"),
  templateId: int("templateId").notNull(),
  
  // Bewertung
  rating: mysqlEnum("feedbackRating", ["positive", "negative"]).notNull(), // Daumen hoch/runter
  
  // Kommentar zum Ergebnis
  comment: text("comment"), // Allgemeiner Kommentar zum Ergebnis
  
  // Verbesserungsvorschläge
  improvementSuggestion: text("improvementSuggestion"), // Freitext-Vorschlag
  suggestedVariables: json("suggestedVariables").$type<Array<{
    name: string;
    description: string;
    type?: string;
  }>>(), // Vorgeschlagene neue Variablen
  
  // Kategorisierung des Feedbacks
  feedbackCategory: mysqlEnum("feedbackCategory", [
    "result_quality",      // Ergebnis-Qualität
    "missing_information", // Fehlende Informationen
    "wrong_format",        // Falsches Format
    "too_long",            // Zu lang
    "too_short",           // Zu kurz
    "other"                // Sonstiges
  ]),
  
  // Status (für Admin-Review)
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "reviewed", "implemented", "rejected"]).default("pending"),
  reviewedBy: int("reviewedBy"),
  reviewNote: text("reviewNote"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
});

export type WorkflowFeedbackEntry = typeof workflowFeedback.$inferSelect;


// ==================== TASK REQUESTS (Individuelle Anfragen) ====================

export const taskRequests = mysqlTable("taskRequests", {
  id: int("id").autoincrement().primaryKey(),
  
  // Anfrage-Details
  description: text("description").notNull(), // Was der Kunde beschrieben hat
  categoryId: int("categoryId"), // Gewählte Kategorie
  businessAreaId: int("businessAreaId"), // Gewählter Unternehmensbereich
  deadline: timestamp("deadline"), // Bis wann das Ergebnis benötigt wird
  urgency: mysqlEnum("urgency", ["normal", "urgent", "asap"]).default("normal"),
  
  // Kontaktdaten (falls nicht eingeloggt)
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactName: varchar("contactName", { length: 255 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  companyName: varchar("companyName", { length: 255 }),
  
  // Benutzer-Referenz (falls eingeloggt)
  userId: int("userId"),
  organizationId: int("organizationId"),
  
  // Status-Tracking
  status: mysqlEnum("requestStatus", [
    "new",           // Neue Anfrage
    "reviewing",     // In Prüfung
    "offer_sent",    // Angebot gesendet
    "accepted",      // Angebot angenommen
    "rejected",      // Angebot abgelehnt
    "in_progress",   // In Bearbeitung
    "completed",     // Abgeschlossen
    "cancelled"      // Storniert
  ]).default("new"),
  
  // Angebot
  offerText: text("offerText"), // Das Angebot an den Kunden
  offerPrice: decimal("offerPrice", { precision: 10, scale: 2 }),
  offerCurrency: varchar("offerCurrency", { length: 3 }).default("EUR"),
  offerValidUntil: timestamp("offerValidUntil"),
  offerSentAt: timestamp("offerSentAt"),
  
  // Verknüpfung zur Lösung
  resultTemplateId: int("resultTemplateId"), // Falls ein Template erstellt wurde
  resultExecutionId: int("resultExecutionId"), // Falls eine Ausführung gemacht wurde
  
  // Klassifizierung (für Lead-Generierung)
  complexity: mysqlEnum("complexity", ["standard", "complex", "custom"]), // Standard/Komplex/Sonderlösung
  estimatedEffort: varchar("estimatedEffort", { length: 100 }), // z.B. "2-4 Stunden"
  
  // Admin-Notizen
  internalNotes: text("internalNotes"),
  assignedTo: int("assignedTo"), // Welcher Admin bearbeitet
  
  // Zeitstempel
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  respondedAt: timestamp("respondedAt"), // Wann geantwortet wurde
  completedAt: timestamp("completedAt"),
});

export type TaskRequest = typeof taskRequests.$inferSelect;
export type InsertTaskRequest = typeof taskRequests.$inferInsert;


// ==================== SUBSCRIPTION PLANS ====================

export const subscriptionPlans = mysqlTable("subscriptionPlans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // z.B. "Test", "Starter", "Business", "Enterprise"
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  
  // Limits
  userLimit: int("userLimit").default(1), // Max. Anzahl User (null = unbegrenzt)
  creditLimit: int("creditLimit"), // Credits pro Monat (null = unbegrenzt)
  
  // Preise
  priceMonthly: decimal("priceMonthly", { precision: 10, scale: 2 }).default("0.00"),
  priceYearly: decimal("priceYearly", { precision: 10, scale: 2 }).default("0.00"),
  currency: varchar("currency", { length: 3 }).default("EUR"),
  
  // Test-Paket Einstellungen
  isTrialPlan: int("isTrialPlan").default(0), // Ist dies das Test-Paket?
  trialDays: int("trialDays").default(90), // Standard: 3 Monate
  
  // Features
  features: json("features").$type<string[]>(), // z.B. ["Alle Templates", "E-Mail Support"]
  
  // Status
  isActive: int("isActive").default(1),
  displayOrder: int("displayOrder").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// ==================== ORGANIZATION SUBSCRIPTIONS ====================

export const organizationSubscriptions = mysqlTable("organizationSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  planId: int("planId").notNull(),
  
  // Status
  status: mysqlEnum("subscriptionStatus", [
    "trial",      // Testphase
    "active",     // Aktives Abo
    "expired",    // Abgelaufen
    "cancelled",  // Gekündigt
    "suspended"   // Gesperrt
  ]).default("trial"),
  
  // Zeitraum
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  validUntil: timestamp("validUntil").notNull(), // Ablaufdatum
  
  // Credits
  creditsUsed: int("creditsUsed").default(0),
  creditsTotal: int("creditsTotal"), // Gesamte Credits für den Zeitraum
  
  // Benachrichtigungen
  expiryWarning14Sent: int("expiryWarning14Sent").default(0),
  expiryWarning7Sent: int("expiryWarning7Sent").default(0),
  expiryWarning1Sent: int("expiryWarning1Sent").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrganizationSubscription = typeof organizationSubscriptions.$inferSelect;

// ==================== ORGANIZATION INVITATIONS ====================

export const organizationInvitations = mysqlTable("organizationInvitations", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  
  // Einladungs-Details
  inviteCode: varchar("inviteCode", { length: 64 }).notNull().unique(), // Eindeutiger Code
  email: varchar("email", { length: 320 }), // Optional: Spezifische E-Mail
  role: mysqlEnum("inviteRole", ["admin", "member"]).default("member"),
  
  // Status
  status: mysqlEnum("inviteStatus", ["pending", "accepted", "expired", "revoked"]).default("pending"),
  
  // Nutzung
  maxUses: int("maxUses").default(1), // Wie oft kann der Code verwendet werden (null = unbegrenzt)
  usedCount: int("usedCount").default(0),
  
  // Zeitraum
  expiresAt: timestamp("expiresAt"), // Ablaufdatum (null = nie)
  
  // Tracking
  createdBy: int("createdBy").notNull(),
  acceptedBy: int("acceptedBy"), // User-ID der Person die den Code verwendet hat
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
});

export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;

// ==================== CREDIT TRANSACTIONS ====================

export const creditTransactions = mysqlTable("creditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  userId: int("userId"), // Wer hat die Credits verbraucht
  
  // Transaktion
  amount: int("amount").notNull(), // Positiv = Gutschrift, Negativ = Verbrauch
  balanceAfter: int("balanceAfter"), // Kontostand nach Transaktion
  
  // Grund
  transactionType: mysqlEnum("transactionType", [
    "subscription_credit",  // Monatliche Credits aus Abo
    "execution",           // Aufgaben-Ausführung
    "bonus",               // Bonus-Credits
    "refund",              // Rückerstattung
    "adjustment"           // Manuelle Anpassung
  ]).notNull(),
  
  // Referenzen
  executionId: int("executionId"), // Bei Ausführung: Welche Execution
  description: text("description"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;


// ==================== PROCESS AUDIT LOG (Vollständiges Prozess-Protokoll) ====================

export const processAuditLog = mysqlTable("processAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  
  // Eindeutige Prozess-ID (KI2GO-YYYY-NNNNN)
  processId: varchar("processId", { length: 50 }).notNull().unique(),
  
  // Referenzen
  userId: int("userId").notNull(),
  organizationId: int("organizationId"),
  executionId: int("executionId"), // Referenz auf workflowExecutions
  templateId: int("templateId"),
  
  // Prozess-Details
  processType: mysqlEnum("processType", [
    "task_execution",      // Aufgaben-Ausführung
    "document_upload",     // Dokument-Upload
    "document_analysis",   // Dokument-Analyse
    "superprompt_generation", // Superprompt-Generierung
    "masking",             // Dokument-Maskierung
    "research_query"       // Recherche-Anfrage
  ]).notNull(),
  
  // Input-Tracking
  inputData: json("inputData").$type<{
    variableValues?: Record<string, any>;
    documentIds?: number[];
    query?: string;
    templateName?: string;
    metapromptId?: number;
  }>(),
  
  // Dokument-Tracking
  documentId: int("documentId"),
  documentName: varchar("documentName", { length: 255 }),
  documentSize: int("documentSize"),
  documentPages: int("documentPages"),
  
  // Kosten-Tracking (SEHR WICHTIG)
  inputTokens: int("inputTokens").default(0),
  outputTokens: int("outputTokens").default(0),
  totalTokens: int("totalTokens").default(0),
  
  // Kosten pro Komponente
  costSuperpromptGeneration: decimal("costSuperpromptGeneration", { precision: 10, scale: 6 }).default("0.000000"),
  costSuperpromptExecution: decimal("costSuperpromptExecution", { precision: 10, scale: 6 }).default("0.000000"),
  costDocumentMasking: decimal("costDocumentMasking", { precision: 10, scale: 6 }).default("0.000000"),
  costDocumentUpload: decimal("costDocumentUpload", { precision: 10, scale: 6 }).default("0.000000"),
  costDocumentAnalysis: decimal("costDocumentAnalysis", { precision: 10, scale: 6 }).default("0.000000"),
  totalCost: decimal("totalCost", { precision: 10, scale: 6 }).default("0.000000"),
  
  // LLM-Details
  llmModel: varchar("llmModel", { length: 100 }),
  llmTemperature: decimal("llmTemperature", { precision: 3, scale: 2 }),
  
  // Ergebnis
  status: mysqlEnum("auditStatus", ["started", "processing", "completed", "failed"]).default("started"),
  resultSummary: text("resultSummary"), // Kurze Zusammenfassung des Ergebnisses
  errorMessage: text("errorMessage"),
  
  // Qualitäts-Metriken
  feedbackRating: mysqlEnum("feedbackRating", ["positive", "negative"]),
  feedbackComment: text("feedbackComment"),
  
  // Zeitstempel
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  executionTimeMs: int("executionTimeMs"),
});

export type ProcessAuditLogEntry = typeof processAuditLog.$inferSelect;

// ==================== DOCUMENT USAGE TRACKING ====================

export const documentUsage = mysqlTable("documentUsage", {
  id: int("id").autoincrement().primaryKey(),
  
  // Referenzen
  documentId: int("documentId").notNull(),
  executionId: int("executionId"), // In welcher Aufgabe verwendet
  processId: varchar("processId", { length: 50 }), // Prozess-ID
  userId: int("userId").notNull(),
  organizationId: int("organizationId"),
  
  // Nutzungs-Details
  usageType: mysqlEnum("usageType", [
    "upload",           // Erstmaliger Upload
    "task_input",       // Als Input für Aufgabe
    "analysis",         // Dokument-Analyse
    "masking",          // Maskierung
    "download",         // Download
    "view"              // Anzeige
  ]).notNull(),
  
  // Kosten für diese Nutzung
  cost: decimal("cost", { precision: 10, scale: 6 }).default("0.000000"),
  tokensUsed: int("tokensUsed").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentUsageEntry = typeof documentUsage.$inferSelect;

// ==================== COST SUMMARY (Aggregierte Kosten pro Tag/Firma) ====================

export const costSummary = mysqlTable("costSummary", {
  id: int("id").autoincrement().primaryKey(),
  
  // Zeitraum
  date: timestamp("date").notNull(), // Tag
  
  // Gruppierung
  organizationId: int("organizationId"), // null = System-gesamt
  userId: int("userId"), // null = Firma-gesamt
  templateId: int("templateId"), // null = alle Templates
  
  // Aggregierte Werte
  executionCount: int("executionCount").default(0),
  totalInputTokens: int("totalInputTokens").default(0),
  totalOutputTokens: int("totalOutputTokens").default(0),
  totalTokens: int("totalTokens").default(0),
  
  // Kosten-Aufschlüsselung
  costSuperpromptGeneration: decimal("costSuperpromptGeneration", { precision: 10, scale: 4 }).default("0.0000"),
  costSuperpromptExecution: decimal("costSuperpromptExecution", { precision: 10, scale: 4 }).default("0.0000"),
  costDocumentProcessing: decimal("costDocumentProcessing", { precision: 10, scale: 4 }).default("0.0000"),
  totalCost: decimal("totalCost", { precision: 10, scale: 4 }).default("0.0000"),
  
  // Durchschnittswerte
  avgCostPerExecution: decimal("avgCostPerExecution", { precision: 10, scale: 6 }).default("0.000000"),
  avgTokensPerExecution: int("avgTokensPerExecution").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostSummaryEntry = typeof costSummary.$inferSelect;

// ==================== ADMIN AUDIT LOG (Admin-Aktionen) ====================

export const adminAuditLog = mysqlTable("adminAuditLog", {
  id: int("id").autoincrement().primaryKey(),
  
  // Wer
  adminUserId: int("adminUserId").notNull(),
  adminUserName: varchar("adminUserName", { length: 255 }),
  
  // Was
  action: varchar("action", { length: 100 }).notNull(), // z.B. "user_role_changed", "template_created"
  actionCategory: mysqlEnum("actionCategory", [
    "user_management",
    "organization_management",
    "template_management",
    "subscription_management",
    "system_settings",
    "data_export"
  ]).notNull(),
  
  // Ziel
  targetType: varchar("targetType", { length: 50 }), // z.B. "user", "organization", "template"
  targetId: int("targetId"),
  targetName: varchar("targetName", { length: 255 }),
  
  // Details
  previousValue: json("previousValue").$type<Record<string, any>>(),
  newValue: json("newValue").$type<Record<string, any>>(),
  description: text("description"),
  
  // Kontext
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminAuditLogEntry = typeof adminAuditLog.$inferSelect;

// ==================== REALTIME STATS CACHE ====================

export const realtimeStatsCache = mysqlTable("realtimeStatsCache", {
  id: int("id").autoincrement().primaryKey(),
  
  statKey: varchar("statKey", { length: 100 }).notNull().unique(), // z.B. "active_users_now", "running_tasks"
  statValue: int("statValue").default(0),
  statData: json("statData").$type<Record<string, any>>(), // Zusätzliche Daten
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});


// ==================== CUSTOM TEMPLATES (Kundenspezifische Anpassungen) ====================

export const customSuperprompts = mysqlTable("customSuperprompts", {
  id: int("id").autoincrement().primaryKey(),
  
  // Custom-Template ID im Format: CT-[OT-Nr]-K[Jahr]-[KundenNr]-V[Version]
  // Beispiel: CT-042-K2026-015-V2
  uniqueId: varchar("uniqueId", { length: 50 }),
  slug: varchar("slug", { length: 255 }),
  
  // Referenz zum Owner-Template (z.B. OT-042-V1)
  sourceTemplateUniqueId: varchar("sourceTemplateUniqueId", { length: 50 }),
  
  // Basis-Template Referenz (Integer-ID)
  baseTemplateId: int("baseTemplateId").notNull(), // Referenz auf taskTemplates (Owner-Templates)
  
  // Kundenzuweisung (Pflichtfeld für Custom-Templates)
  organizationId: int("organizationId"), // Welche Firma - NULL = global
  userId: int("userId"), // Welcher User - NULL = alle User der Firma
  
  // ==================== GRUNDDATEN (identisch zu Owner-Templates) ====================
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }), // Anzeige-Titel
  description: text("description"),
  shortDescription: varchar("shortDescription", { length: 500 }),
  superprompt: text("superprompt").notNull(), // Der angepasste Superprompt
  
  // ==================== KATEGORISIERUNG ====================
  categoryId: int("categoryId"),
  businessAreaId: int("businessAreaId"),
  icon: varchar("icon", { length: 100 }).default("FileText"),
  color: varchar("color", { length: 20 }),
  
  // ==================== VARIABLEN ====================
  variableSchema: json("variableSchema").$type<Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'boolean' | 'file';
    required: boolean;
    placeholder?: string;
    defaultValue?: any;
    options?: string[];
    helpText?: string;
    validation?: { min?: number; max?: number; pattern?: string };
  }>>(),
  
  // ==================== LLM-EINSTELLUNGEN ====================
  estimatedTimeSavings: int("estimatedTimeSavings"), // Geschätzte Zeitersparnis in Minuten
  creditCost: int("creditCost").default(1), // Kosten in Credits
  llmModel: varchar("llmModel", { length: 100 }),
  llmTemperature: decimal("llmTemperature", { precision: 3, scale: 2 }).default("0.7"),
  maxTokens: int("maxTokens"),
  outputFormat: mysqlEnum("outputFormat", ["markdown", "json", "text", "html"]).default("markdown"),
  exampleOutput: text("exampleOutput"),
  
  // ==================== DOKUMENT-EINSTELLUNGEN ====================
  documentRequired: int("documentRequired").default(0),
  documentCount: int("documentCount").default(1),
  allowedFileTypes: json("allowedFileTypes").$type<string[]>(),
  maxFileSize: int("maxFileSize").default(10485760), // 10MB
  maxPages: int("maxPages"),
  documentRelevanceCheck: int("documentRelevanceCheck").default(0),
  documentDescription: text("documentDescription"),
  
  // ==================== MASKING-EINSTELLUNGEN ====================
  maskingRequired: int("maskingRequired").default(0),
  maskingTypes: json("maskingTypes").$type<string[]>(),
  autoMasking: int("autoMasking").default(0),
  
  // ==================== KEYWORDS ====================
  keywords: json("keywords").$type<string[]>(),
  
  // ==================== MARKETING & SEO ====================
  marketingEnabled: int("marketingEnabled").default(0),
  marketingHeadline: varchar("marketingHeadline", { length: 100 }),
  marketingSubheadline: varchar("marketingSubheadline", { length: 200 }),
  marketingUsps: json("marketingUsps").$type<string[]>(),
  marketingCtaText: varchar("marketingCtaText", { length: 50 }),
  marketingMetaDescription: varchar("marketingMetaDescription", { length: 160 }),
  marketingKeywords: json("marketingKeywords").$type<string[]>(),
  
  // ==================== ROI-KALKULATION ====================
  roiBaseTimeMinutes: int("roiBaseTimeMinutes"),
  roiTimePerDocumentMinutes: int("roiTimePerDocumentMinutes"),
  roiKi2goTimeMinutes: int("roiKi2goTimeMinutes"),
  roiKi2goTimePerDocument: int("roiKi2goTimePerDocument").default(1), // KI2GO Zeit pro zusätzliches Dokument
  roiHourlyRate: int("roiHourlyRate"),
  roiTasksPerMonth: int("roiTasksPerMonth").default(10), // Aufgaben pro Monat für Jahresersparnis-Berechnung
  roiSources: json("roiSources").$type<{ name: string; url: string; finding: string }[]>(), // Quellenangaben für ROI-Werte
  
  // Disclaimer (rechtlicher Hinweis für Ergebnisse)
  disclaimer: text("disclaimer"), // Individueller Disclaimer für diese Aufgabe
  
  // ==================== AUTOR-TRACKING ====================
  createdByName: varchar("createdByName", { length: 255 }),
  lastModifiedByName: varchar("lastModifiedByName", { length: 255 }),
  templateVersion: varchar("templateVersion", { length: 20 }).default("1.0"),
  changeLog: text("changeLog"),
  
  // ==================== HERKUNFT & STATUS ====================
  createdFromExecutionId: int("createdFromExecutionId"), // Welche Ausführung war die Basis
  createdBy: int("createdBy").notNull(), // Wer hat es erstellt (Owner/Admin)
  
  // Status (Kunde kann ändern: aktiv/pausiert, Admin kann: archiviert/änderung_angefragt)
  status: mysqlEnum("status", ["active", "paused", "archived", "change_requested"]).default("active"),
  isActive: int("isActive").default(1).notNull(), // Legacy-Feld für Abwärtskompatibilität
  
  // Versionierung
  version: int("version").default(1).notNull(),
  
  // Nutzungsstatistiken
  usageCount: int("usageCount").default(0),
  lastUsedAt: timestamp("lastUsedAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomSuperprompt = typeof customSuperprompts.$inferSelect;
export type InsertCustomSuperprompt = typeof customSuperprompts.$inferInsert;

// Versionshistorie für Custom-Superprompts
export const customSuperpromptHistory = mysqlTable("customSuperpromptHistory", {
  id: int("id").autoincrement().primaryKey(),
  
  customSuperpromptId: int("customSuperpromptId").notNull(),
  version: int("version").notNull(),
  superprompt: text("superprompt").notNull(), // Der Superprompt dieser Version
  
  changedBy: int("changedBy").notNull(),
  changeDescription: text("changeDescription"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomSuperpromptHistoryEntry = typeof customSuperpromptHistory.$inferSelect;


// ==================== PRICING PLANS & SUBSCRIPTIONS ====================

// Preispläne (Free, Starter, Business, Enterprise)
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(), // free, starter, business, enterprise
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  
  // Limits (0 = unlimited)
  taskLimit: int("taskLimit").default(10).notNull(), // Aufgaben pro Monat
  customTemplateLimit: int("customTemplateLimit").default(2).notNull(), // Anzahl Custom Templates
  storageLimit: int("storageLimit").default(100).notNull(), // MB Speicherplatz
  teamMemberLimit: int("teamMemberLimit").default(1).notNull(), // Anzahl Mitarbeiter
  
  // Features als JSON Array: ["upload", "download", "sharing", "monitoring", "masking"]
  features: text("features"), // JSON Array
  
  // Preise (optional, für später)
  priceMonthly: decimal("priceMonthly", { precision: 10, scale: 2 }),
  priceYearly: decimal("priceYearly", { precision: 10, scale: 2 }),
  
  // Sortierung und Status
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  isDefault: boolean("isDefault").default(false), // Wird neuen Usern zugewiesen
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

// User-Subscriptions
export const userSubscriptions = mysqlTable("userSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  
  // Status: active, cancelled, expired, trial
  status: mysqlEnum("status", ["active", "cancelled", "expired", "trial"]).default("trial").notNull(),
  
  // Zeitraum
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  validUntil: timestamp("validUntil"),
  cancelledAt: timestamp("cancelledAt"),
  
  // Billing (für später)
  billingCycle: mysqlEnum("billingCycle", ["monthly", "yearly"]).default("monthly"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

// Usage-Tracking (pro Monat)
export const usageTracking = mysqlTable("usageTracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  organizationId: int("organizationId"), // Für Firmen-Aggregation
  
  // Zeitraum (YYYY-MM Format)
  periodMonth: varchar("periodMonth", { length: 7 }).notNull(), // z.B. "2026-01"
  
  // Verbrauch
  tasksUsed: int("tasksUsed").default(0).notNull(),
  storageUsedMb: int("storageUsedMb").default(0).notNull(),
  customTemplatesCreated: int("customTemplatesCreated").default(0).notNull(),
  documentsUploaded: int("documentsUploaded").default(0).notNull(),
  documentsDownloaded: int("documentsDownloaded").default(0).notNull(),
  
  // Token-Verbrauch (für Manus-Kosten-Tracking)
  inputTokens: int("inputTokens").default(0).notNull(),
  outputTokens: int("outputTokens").default(0).notNull(),
  totalCostEur: decimal("totalCostEur", { precision: 10, scale: 6 }).default("0"), // Kosten in EUR
  
  // Detaillierte Statistiken (JSON)
  details: text("details"), // z.B. { templateUsage: { "SP-001": 5, "SP-002": 3 } }
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = typeof usageTracking.$inferInsert;

// ==================== KUNDEN-TEMPLATE VERWALTUNG ====================

// Kunden-Kategorien für Custom Templates
export const templateCategories = mysqlTable("templateCategories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Gehört diesem User
  organizationId: int("organizationId"), // Oder dieser Organisation
  
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }),
  description: text("description"),
  color: varchar("color", { length: 20 }), // z.B. "#3B82F6"
  icon: varchar("icon", { length: 50 }), // z.B. "Folder"
  sortOrder: int("sortOrder").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TemplateCategory = typeof templateCategories.$inferSelect;
export type InsertTemplateCategory = typeof templateCategories.$inferInsert;

// Zuordnung: Custom Template -> Kategorie
export const templateCategoryAssignments = mysqlTable("templateCategoryAssignments", {
  id: int("id").autoincrement().primaryKey(),
  customTemplateId: int("customTemplateId").notNull(),
  categoryId: int("categoryId").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TemplateCategoryAssignment = typeof templateCategoryAssignments.$inferSelect;

// Mitarbeiter-Freigaben für Custom Templates
export const templateMemberAssignments = mysqlTable("templateMemberAssignments", {
  id: int("id").autoincrement().primaryKey(),
  customTemplateId: int("customTemplateId").notNull(),
  userId: int("userId").notNull(), // Mitarbeiter der Zugriff hat
  
  // Wer hat freigegeben
  assignedBy: int("assignedBy").notNull(),
  
  // Berechtigungen
  canUse: boolean("canUse").default(true).notNull(),
  canView: boolean("canView").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TemplateMemberAssignment = typeof templateMemberAssignments.$inferSelect;
export type InsertTemplateMemberAssignment = typeof templateMemberAssignments.$inferInsert;


// ==================== TEMPLATE CHANGE REQUESTS (Änderungsanfragen) ====================

export const templateChangeRequests = mysqlTable("templateChangeRequests", {
  id: int("id").autoincrement().primaryKey(),
  
  // Welches Custom-Template soll geändert werden
  customTemplateId: int("customTemplateId").notNull(),
  
  // Wer hat die Anfrage gestellt
  requestedBy: int("requestedBy").notNull(), // User-ID
  organizationId: int("organizationId"), // Firma des Antragstellers
  
  // Anfrage-Details
  title: varchar("title", { length: 255 }).notNull(), // Kurze Beschreibung
  description: text("description").notNull(), // Ausführliche Beschreibung der gewünschten Änderung
  reason: text("reason"), // Warum wird die Änderung benötigt?
  
  // Priorität
  priority: mysqlEnum("changeRequestPriority", ["low", "normal", "high", "urgent"]).default("normal"),
  
  // Status-Workflow: Offen → In Bearbeitung → Umgesetzt/Abgelehnt
  status: mysqlEnum("changeRequestStatus", [
    "open",           // Neu eingereicht
    "in_review",      // Wird geprüft
    "in_progress",    // Wird umgesetzt
    "implemented",    // Erfolgreich umgesetzt
    "rejected",       // Abgelehnt
    "closed"          // Geschlossen ohne Umsetzung
  ]).default("open"),
  
  // Admin-Bearbeitung
  assignedTo: int("assignedTo"), // Welcher Admin bearbeitet
  reviewNote: text("reviewNote"), // Interne Notizen des Admins
  rejectionReason: text("rejectionReason"), // Grund für Ablehnung
  
  // Ergebnis der Bearbeitung
  resultType: mysqlEnum("changeResultType", [
    "custom_only",    // Nur Custom-Template geändert (individuelle Anpassung)
    "owner_updated",  // Owner-Template verbessert (revolutionäre Idee)
    "no_change"       // Keine Änderung vorgenommen
  ]),
  resultNote: text("resultNote"), // Beschreibung was geändert wurde
  
  // Neue Version nach Änderung
  newVersion: int("newVersion"), // Welche Version wurde erstellt
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  completedAt: timestamp("completedAt"),
});

export type TemplateChangeRequest = typeof templateChangeRequests.$inferSelect;
export type InsertTemplateChangeRequest = typeof templateChangeRequests.$inferInsert;


// ==================== TESTRAUM (Owner Test-Sessions) ====================

// Test-Sessions für Owner zum Testen der User-Erfahrung
export const testSessions = mysqlTable("testSessions", {
  id: int("id").autoincrement().primaryKey(),
  
  // Wer testet
  ownerUserId: int("ownerUserId").notNull(), // Der Owner der testet
  
  // Test-Modus
  testMode: mysqlEnum("testMode", [
    "user",           // Als normaler User testen
    "firma_admin",    // Als Firmen-Admin testen
    "firma_member"    // Als Firmen-Mitarbeiter testen
  ]).notNull(),
  
  // Test-Organisation (wird automatisch erstellt)
  testOrganizationId: int("testOrganizationId"), // Die Test-Firma
  
  // Simulierte Szenarien
  simulatedScenario: mysqlEnum("simulatedScenario", [
    "normal",              // Normaler Zustand
    "credits_low",         // Credits fast leer (< 20%)
    "credits_empty",       // Keine Credits mehr
    "subscription_expiring", // Abo läuft bald ab (< 7 Tage)
    "subscription_expired",  // Abo abgelaufen
    "account_suspended"      // Account gesperrt
  ]).default("normal"),
  
  // Simuliertes Paket (überschreibt echtes Paket)
  simulatedPlanId: int("simulatedPlanId"), // null = echtes Paket verwenden
  simulatedCreditsUsed: int("simulatedCreditsUsed"), // null = echte Credits
  simulatedCreditsTotal: int("simulatedCreditsTotal"),
  
  // Session-Status
  isActive: int("isActive").default(1).notNull(),
  
  // Timestamps
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});

export type TestSession = typeof testSessions.$inferSelect;
export type InsertTestSession = typeof testSessions.$inferInsert;

// Simulierte Test-User (ohne echte Anmeldung)
export const testUsers = mysqlTable("testUsers", {
  id: int("id").autoincrement().primaryKey(),
  
  // Erstellt von welchem Owner
  createdByOwnerId: int("createdByOwnerId").notNull(),
  
  // Test-Organisation
  testOrganizationId: int("testOrganizationId").notNull(),
  
  // Simulierter User
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }), // Fake E-Mail für Tests
  role: mysqlEnum("testUserRole", ["admin", "member"]).default("member").notNull(),
  
  // Abteilungs-Zuweisung
  categoryId: int("categoryId"),
  businessAreaId: int("businessAreaId"),
  
  // Simulierte Nutzung
  tasksExecuted: int("tasksExecuted").default(0),
  lastActiveAt: timestamp("lastActiveAt"),
  
  // Status
  isActive: int("isActive").default(1).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TestUser = typeof testUsers.$inferSelect;
export type InsertTestUser = typeof testUsers.$inferInsert;
