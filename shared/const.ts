export const COOKIE_NAME = "ki2go_session";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Bitte melden Sie sich an (10001)';
export const NOT_ADMIN_ERR_MSG = 'Sie haben nicht die erforderlichen Berechtigungen (10002)';

// ==================== KATEGORIEN ====================
export const CATEGORIES = [
  { value: "analysieren_pruefen", label: "Analysieren & Prüfen", icon: "Search", description: "Verträge, Dokumente, Daten analysieren" },
  { value: "erstellen_kreieren", label: "Erstellen & Kreieren", icon: "Sparkles", description: "Neue Inhalte, Konzepte, Designs erstellen" },
  { value: "schreiben_verfassen", label: "Schreiben & Verfassen", icon: "PenLine", description: "Texte, E-Mails, Berichte schreiben" },
  { value: "recherche_suche", label: "Recherche & Suche", icon: "Globe", description: "Informationen suchen, Marktanalysen" },
  { value: "uebersetzen_umwandeln", label: "Übersetzen & Umwandeln", icon: "Languages", description: "Sprachen, Formate konvertieren" },
  { value: "vergleichen_zusammenfassen", label: "Vergleichen & Zusammenfassen", icon: "GitCompare", description: "Angebote, Optionen vergleichen" },
  { value: "zusammenfassen_erklaeren", label: "Zusammenfassen & Erklären", icon: "BookOpen", description: "Komplexe Inhalte vereinfachen" },
  { value: "planen_organisieren", label: "Planen & Organisieren", icon: "CalendarDays", description: "Projekte, Prozesse strukturieren" },
] as const;

export type CategoryValue = typeof CATEGORIES[number]["value"];

// ==================== UNTERNEHMENSBEREICHE ====================
export const BUSINESS_AREAS = [
  { value: "sales_vertrieb", label: "Sales & Vertrieb", icon: "TrendingUp" },
  { value: "marketing_pr", label: "Marketing & PR", icon: "Megaphone" },
  { value: "legal_recht", label: "Legal & Recht", icon: "Scale" },
  { value: "hr_recruiting", label: "HR & Recruiting", icon: "Users" },
  { value: "einkauf_finanzen", label: "Einkauf & Finanzen", icon: "Wallet" },
  { value: "management_strategie", label: "Management & Strategie", icon: "Target" },
  { value: "customer_success", label: "Customer Success", icon: "HeartHandshake" },
  { value: "growth_leadgen", label: "Growth & Lead Generation", icon: "Rocket" },
  { value: "bid_management", label: "Bid Management", icon: "FileText" },
  { value: "projektmanagement", label: "Projektmanagement", icon: "Kanban" },
  { value: "operations", label: "Operations", icon: "Settings" },
] as const;

export type BusinessAreaValue = typeof BUSINESS_AREAS[number]["value"];

// ==================== QUICK ACTIONS ====================
export const QUICK_ACTIONS = [
  { slug: "vertrag-pruefen", title: "Vertrag prüfen", icon: "FileCheck", description: "Rechtliche Analyse von Verträgen" },
  { slug: "bilanz-analysieren", title: "Bilanz analysieren", icon: "Calculator", description: "Finanzielle Kennzahlen auswerten" },
  { slug: "meeting-protokoll", title: "Meeting-Protokoll", icon: "ClipboardList", description: "Gesprächsnotizen strukturieren" },
  { slug: "email-schreiben", title: "E-Mail schreiben", icon: "Mail", description: "Professionelle E-Mails verfassen" },
  { slug: "marktanalyse", title: "Marktanalyse erstellen", icon: "BarChart3", description: "Wettbewerbsanalyse durchführen" },
  { slug: "praesentation", title: "Präsentation erstellen", icon: "Presentation", description: "Slides mit Inhalten generieren" },
] as const;

// ==================== DOKUMENT-LIMITS ====================
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_DOCUMENT_PAGES = 50;
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

// ==================== LLM KONFIGURATION ====================
export const LLM_MODELS = {
  ANALYSIS: "claude-opus-3",
  CREATIVE: "gpt-4",
  WRITING: "gpt-3.5-turbo",
  DEFAULT: "gpt-4",
} as const;

// ==================== VARIABLE TYPES ====================
export const VARIABLE_TYPES = ["text", "textarea", "number", "select", "file"] as const;
export type VariableType = typeof VARIABLE_TYPES[number];

export interface VariableSchema {
  name: string;
  type: VariableType;
  label: string;
  placeholder?: string;
  required: boolean;
  defaultValue?: string;
  options?: string[];
  order?: number;
}

// ==================== WORKFLOW STATUS ====================
export const WORKFLOW_STATUS = ["started", "in_progress", "completed", "failed"] as const;
export type WorkflowStatus = typeof WORKFLOW_STATUS[number];

// ==================== FEEDBACK TYPES ====================
export const FEEDBACK_TYPES = ["helpful", "confusing", "missing", "unnecessary"] as const;
export type FeedbackType = typeof FEEDBACK_TYPES[number];

// ==================== ROLES ====================
export const USER_ROLES = ["user", "admin", "owner"] as const;
export type UserRole = typeof USER_ROLES[number];

// ==================== DESIGN TOKENS ====================
export const COLORS = {
  primaryDark: "#1E3A5F",      // Navy
  primaryAccent: "#5FBDCE",    // Türkis
  secondaryAccent: "#F97316",  // Orange
  bgAdmin: "#F0F9FF",
  bgDark: "#111827",
} as const;
