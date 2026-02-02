import { getDb } from "./db";
import { plans, userSubscriptions, usageTracking } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Feature-Keys die in Plans gespeichert werden
export type FeatureKey = 
  | "tasks"
  | "custom_templates"
  | "template_sharing"
  | "document_upload"
  | "document_download"
  | "storage"
  | "monitoring"
  | "masking"
  | "request_tasks"
  | "priority_support";

// Limit-Keys die in Plans gespeichert werden
export type LimitKey = "tasks" | "customTemplates" | "storage" | "teamMembers";

// Plan mit Features
export interface UserPlan {
  planId: number;
  planSlug: string;
  planName: string;
  status: "active" | "cancelled" | "expired" | "trial";
  features: FeatureKey[];
  limits: {
    tasks: number;
    customTemplates: number;
    storage: number; // MB
    teamMembers: number;
  };
  validUntil: Date | null;
}

// Aktuellen Monat als String (YYYY-MM)
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Lädt den aktuellen Plan eines Users
 */
export async function getUserPlan(userId: number): Promise<UserPlan | null> {
  const db = await getDb();
  if (!db) return null;

  // Subscription des Users laden
  const [subscription] = await db
    .select({
      planId: userSubscriptions.planId,
      status: userSubscriptions.status,
      validUntil: userSubscriptions.validUntil,
    })
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  // Wenn keine Subscription, Default-Plan (Free) laden
  let planId = subscription?.planId;
  if (!planId) {
    const [defaultPlan] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.isDefault, true))
      .limit(1);
    planId = defaultPlan?.id || 1;
  }

  // Plan-Details laden
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  if (!plan) return null;

  // Features parsen
  let features: FeatureKey[] = [];
  try {
    features = plan.features ? JSON.parse(plan.features) : [];
  } catch {
    features = [];
  }

  return {
    planId: plan.id,
    planSlug: plan.slug,
    planName: plan.name,
    status: subscription?.status || "trial",
    features,
    limits: {
      tasks: plan.taskLimit,
      customTemplates: plan.customTemplateLimit,
      storage: plan.storageLimit,
      teamMembers: plan.teamMemberLimit,
    },
    validUntil: subscription?.validUntil || null,
  };
}

/**
 * Prüft ob ein User ein bestimmtes Feature nutzen kann
 */
export async function checkFeature(userId: number, feature: FeatureKey): Promise<boolean> {
  const plan = await getUserPlan(userId);
  if (!plan) return false;

  // Prüfe ob Plan aktiv oder im Trial ist
  if (plan.status !== "active" && plan.status !== "trial") {
    return false;
  }

  // Prüfe ob Feature im Plan enthalten ist
  return plan.features.includes(feature);
}

/**
 * Prüft ob ein User ein Limit erreicht hat
 * Gibt { allowed: boolean, used: number, limit: number, remaining: number } zurück
 */
export async function checkLimit(
  userId: number,
  limitKey: LimitKey
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  const db = await getDb();
  if (!db) return { allowed: false, used: 0, limit: 0, remaining: 0 };

  const plan = await getUserPlan(userId);
  if (!plan) return { allowed: false, used: 0, limit: 0, remaining: 0 };

  // Limit aus Plan holen (0 = unlimited)
  let limit = 0;
  switch (limitKey) {
    case "tasks":
      limit = plan.limits.tasks;
      break;
    case "customTemplates":
      limit = plan.limits.customTemplates;
      break;
    case "storage":
      limit = plan.limits.storage;
      break;
    case "teamMembers":
      limit = plan.limits.teamMembers;
      break;
  }

  // Wenn Limit 0, dann unlimited
  if (limit === 0) {
    return { allowed: true, used: 0, limit: 0, remaining: Infinity };
  }

  // Aktuellen Verbrauch laden
  const currentMonth = getCurrentMonth();
  const [usage] = await db
    .select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.periodMonth, currentMonth)
      )
    )
    .limit(1);

  let used = 0;
  switch (limitKey) {
    case "tasks":
      used = usage?.tasksUsed || 0;
      break;
    case "customTemplates":
      used = usage?.customTemplatesCreated || 0;
      break;
    case "storage":
      used = usage?.storageUsedMb || 0;
      break;
    case "teamMembers":
      // Team Members werden anders gezählt (nicht pro Monat)
      // TODO: Implementieren wenn Team-Feature fertig
      used = 0;
      break;
  }

  const remaining = Math.max(0, limit - used);
  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
  };
}

/**
 * Erhöht den Usage-Counter für einen User
 */
export async function incrementUsage(
  userId: number,
  type: "tasks" | "customTemplates" | "storage" | "documentsUploaded" | "documentsDownloaded",
  amount: number = 1
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const currentMonth = getCurrentMonth();

  // Prüfe ob bereits ein Eintrag für diesen Monat existiert
  const [existing] = await db
    .select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.periodMonth, currentMonth)
      )
    )
    .limit(1);

  if (existing) {
    // Update existierenden Eintrag
    const updateData: Record<string, number> = {};
    switch (type) {
      case "tasks":
        updateData.tasksUsed = existing.tasksUsed + amount;
        break;
      case "customTemplates":
        updateData.customTemplatesCreated = existing.customTemplatesCreated + amount;
        break;
      case "storage":
        updateData.storageUsedMb = existing.storageUsedMb + amount;
        break;
      case "documentsUploaded":
        updateData.documentsUploaded = existing.documentsUploaded + amount;
        break;
      case "documentsDownloaded":
        updateData.documentsDownloaded = existing.documentsDownloaded + amount;
        break;
    }

    await db
      .update(usageTracking)
      .set(updateData)
      .where(eq(usageTracking.id, existing.id));
  } else {
    // Neuen Eintrag erstellen
    await db.insert(usageTracking).values({
      userId,
      periodMonth: currentMonth,
      tasksUsed: type === "tasks" ? amount : 0,
      customTemplatesCreated: type === "customTemplates" ? amount : 0,
      storageUsedMb: type === "storage" ? amount : 0,
      documentsUploaded: type === "documentsUploaded" ? amount : 0,
      documentsDownloaded: type === "documentsDownloaded" ? amount : 0,
    });
  }

  return true;
}

/**
 * Lädt die aktuelle Usage eines Users
 */
export async function getUserUsage(userId: number): Promise<{
  tasksUsed: number;
  storageUsedMb: number;
  customTemplatesCreated: number;
  documentsUploaded: number;
  documentsDownloaded: number;
} | null> {
  const db = await getDb();
  if (!db) return null;

  const currentMonth = getCurrentMonth();
  const [usage] = await db
    .select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.periodMonth, currentMonth)
      )
    )
    .limit(1);

  if (!usage) {
    return {
      tasksUsed: 0,
      storageUsedMb: 0,
      customTemplatesCreated: 0,
      documentsUploaded: 0,
      documentsDownloaded: 0,
    };
  }

  return {
    tasksUsed: usage.tasksUsed,
    storageUsedMb: usage.storageUsedMb,
    customTemplatesCreated: usage.customTemplatesCreated,
    documentsUploaded: usage.documentsUploaded,
    documentsDownloaded: usage.documentsDownloaded,
  };
}

/**
 * Erhöht den Token- und Kosten-Verbrauch für einen User
 */
export async function incrementTokenUsage(
  userId: number,
  inputTokens: number,
  outputTokens: number,
  costEur: number,
  organizationId?: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const currentMonth = getCurrentMonth();

  // Prüfe ob bereits ein Eintrag für diesen Monat existiert
  const [existing] = await db
    .select()
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.periodMonth, currentMonth)
      )
    )
    .limit(1);

  if (existing) {
    // Update existierenden Eintrag
    await db
      .update(usageTracking)
      .set({
        inputTokens: (existing.inputTokens || 0) + inputTokens,
        outputTokens: (existing.outputTokens || 0) + outputTokens,
        totalCostEur: String(parseFloat(String(existing.totalCostEur || 0)) + costEur),
        organizationId: organizationId || existing.organizationId,
      })
      .where(eq(usageTracking.id, existing.id));
  } else {
    // Neuen Eintrag erstellen
    await db.insert(usageTracking).values({
      userId,
      organizationId: organizationId || null,
      periodMonth: currentMonth,
      tasksUsed: 0,
      customTemplatesCreated: 0,
      storageUsedMb: 0,
      documentsUploaded: 0,
      documentsDownloaded: 0,
      inputTokens,
      outputTokens,
      totalCostEur: String(costEur),
    });
  }

  return true;
}

/**
 * Lädt die Kosten-Übersicht für einen User (für Owner-Dashboard)
 */
export async function getUserCostSummary(userId: number): Promise<{
  currentMonth: { inputTokens: number; outputTokens: number; totalCostEur: number };
  allTime: { inputTokens: number; outputTokens: number; totalCostEur: number };
} | null> {
  const db = await getDb();
  if (!db) return null;

  const currentMonth = getCurrentMonth();

  // Aktueller Monat
  const [currentUsage] = await db
    .select({
      inputTokens: usageTracking.inputTokens,
      outputTokens: usageTracking.outputTokens,
      totalCostEur: usageTracking.totalCostEur,
    })
    .from(usageTracking)
    .where(
      and(
        eq(usageTracking.userId, userId),
        eq(usageTracking.periodMonth, currentMonth)
      )
    )
    .limit(1);

  // Alle Monate summieren
  const allUsage = await db
    .select({
      inputTokens: usageTracking.inputTokens,
      outputTokens: usageTracking.outputTokens,
      totalCostEur: usageTracking.totalCostEur,
    })
    .from(usageTracking)
    .where(eq(usageTracking.userId, userId));

  const allTimeSum = allUsage.reduce(
    (acc, u) => ({
      inputTokens: acc.inputTokens + (u.inputTokens || 0),
      outputTokens: acc.outputTokens + (u.outputTokens || 0),
      totalCostEur: acc.totalCostEur + parseFloat(String(u.totalCostEur || 0)),
    }),
    { inputTokens: 0, outputTokens: 0, totalCostEur: 0 }
  );

  return {
    currentMonth: {
      inputTokens: currentUsage?.inputTokens || 0,
      outputTokens: currentUsage?.outputTokens || 0,
      totalCostEur: parseFloat(String(currentUsage?.totalCostEur || 0)),
    },
    allTime: allTimeSum,
  };
}

/**
 * Lädt die Kosten-Übersicht für alle Kunden (für Owner-Dashboard)
 */
export async function getAllCustomersCostSummary(): Promise<Array<{
  userId: number;
  organizationId: number | null;
  currentMonth: { tasksUsed: number; inputTokens: number; outputTokens: number; totalCostEur: number };
}>> {
  const db = await getDb();
  if (!db) return [];

  const currentMonth = getCurrentMonth();

  const usage = await db
    .select({
      userId: usageTracking.userId,
      organizationId: usageTracking.organizationId,
      tasksUsed: usageTracking.tasksUsed,
      inputTokens: usageTracking.inputTokens,
      outputTokens: usageTracking.outputTokens,
      totalCostEur: usageTracking.totalCostEur,
    })
    .from(usageTracking)
    .where(eq(usageTracking.periodMonth, currentMonth));

  return usage.map((u) => ({
    userId: u.userId,
    organizationId: u.organizationId,
    currentMonth: {
      tasksUsed: u.tasksUsed,
      inputTokens: u.inputTokens || 0,
      outputTokens: u.outputTokens || 0,
      totalCostEur: parseFloat(String(u.totalCostEur || 0)),
    },
  }));
}

/**
 * Lädt die Gesamt-Kosten für den Owner (Manus-Kosten)
 */
export async function getTotalManusCoststSummary(): Promise<{
  currentMonth: { tasksUsed: number; inputTokens: number; outputTokens: number; totalCostEur: number };
  allTime: { tasksUsed: number; inputTokens: number; outputTokens: number; totalCostEur: number };
}> {
  const db = await getDb();
  if (!db) return {
    currentMonth: { tasksUsed: 0, inputTokens: 0, outputTokens: 0, totalCostEur: 0 },
    allTime: { tasksUsed: 0, inputTokens: 0, outputTokens: 0, totalCostEur: 0 },
  };

  const currentMonth = getCurrentMonth();

  // Alle Usage-Einträge laden
  const allUsage = await db
    .select({
      periodMonth: usageTracking.periodMonth,
      tasksUsed: usageTracking.tasksUsed,
      inputTokens: usageTracking.inputTokens,
      outputTokens: usageTracking.outputTokens,
      totalCostEur: usageTracking.totalCostEur,
    })
    .from(usageTracking);

  // Aktueller Monat
  const currentMonthData = allUsage.filter((u) => u.periodMonth === currentMonth);
  const currentMonthSum = currentMonthData.reduce(
    (acc, u) => ({
      tasksUsed: acc.tasksUsed + u.tasksUsed,
      inputTokens: acc.inputTokens + (u.inputTokens || 0),
      outputTokens: acc.outputTokens + (u.outputTokens || 0),
      totalCostEur: acc.totalCostEur + parseFloat(String(u.totalCostEur || 0)),
    }),
    { tasksUsed: 0, inputTokens: 0, outputTokens: 0, totalCostEur: 0 }
  );

  // Alle Zeit
  const allTimeSum = allUsage.reduce(
    (acc, u) => ({
      tasksUsed: acc.tasksUsed + u.tasksUsed,
      inputTokens: acc.inputTokens + (u.inputTokens || 0),
      outputTokens: acc.outputTokens + (u.outputTokens || 0),
      totalCostEur: acc.totalCostEur + parseFloat(String(u.totalCostEur || 0)),
    }),
    { tasksUsed: 0, inputTokens: 0, outputTokens: 0, totalCostEur: 0 }
  );

  return {
    currentMonth: currentMonthSum,
    allTime: allTimeSum,
  };
}

/**
 * Weist einem User den Default-Plan zu (für neue Registrierungen)
 */
export async function assignDefaultPlan(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Prüfe ob User bereits eine Subscription hat
  const [existing] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId))
    .limit(1);

  if (existing) return true; // Bereits zugewiesen

  // Default-Plan laden
  const [defaultPlan] = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.isDefault, true))
    .limit(1);

  if (!defaultPlan) return false;

  // Subscription erstellen
  await db.insert(userSubscriptions).values({
    userId,
    planId: defaultPlan.id,
    status: "trial",
  });

  return true;
}
