import { eq, desc, and, sql, like, isNull, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  metapromptTemplates, MetapromptTemplate,
  superpromptCollection, Superprompt,
  documents, Document,
  workflowProtocols, WorkflowProtocol,
  analyticsEvents, llmUsage,
  researchQueries, researchClusters,
  superpromptFeedback, variableFeedback,
  systemSettings, adminLogs, fallbackSuggestions,
  organizations, organizationMembers, teams
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER QUERIES ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'owner';
      updateSet.role = 'owner';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

// ==================== METAPROMPT TEMPLATES ====================

export async function getActiveMetapromptTemplate() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(metapromptTemplates)
    .where(eq(metapromptTemplates.isActive, 1))
    .orderBy(desc(metapromptTemplates.version))
    .limit(1);
  return result[0];
}

export async function getAllMetapromptTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(metapromptTemplates).orderBy(desc(metapromptTemplates.createdAt));
}

export async function createMetapromptTemplate(data: Partial<MetapromptTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(metapromptTemplates).values(data as any);
  return result;
}

export async function updateMetapromptTemplate(id: number, data: Partial<MetapromptTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(metapromptTemplates).set(data as any).where(eq(metapromptTemplates.id, id));
}

// ==================== SUPERPROMPT COLLECTION ====================

export async function getCuratedSuperprompts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(superpromptCollection)
    .where(and(eq(superpromptCollection.isCurated, 1), eq(superpromptCollection.isActive, 1)))
    .orderBy(desc(superpromptCollection.usageCount));
}

export async function getSuperpromptBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(superpromptCollection)
    .where(eq(superpromptCollection.slug, slug))
    .limit(1);
  return result[0];
}

export async function getSuperpromptById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(superpromptCollection)
    .where(eq(superpromptCollection.id, id))
    .limit(1);
  return result[0];
}

export async function createSuperprompt(data: Partial<Superprompt>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(superpromptCollection).values(data as any);
  return result;
}

export async function updateSuperprompt(id: number, data: Partial<Superprompt>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(superpromptCollection).set(data as any).where(eq(superpromptCollection.id, id));
}

export async function incrementSuperpromptUsage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(superpromptCollection)
    .set({ usageCount: sql`${superpromptCollection.usageCount} + 1` })
    .where(eq(superpromptCollection.id, id));
}

export async function getUserSuperprompts(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(superpromptCollection)
    .where(eq(superpromptCollection.userId, userId))
    .orderBy(desc(superpromptCollection.createdAt))
    .limit(limit);
}

// ==================== DOCUMENTS ====================

export async function createDocument(data: Partial<Document>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(data as any);
  return result;
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0];
}

export async function getUserDocuments(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.uploadedAt))
    .limit(limit);
}

// ==================== WORKFLOW PROTOCOLS ====================

export async function createWorkflowProtocol(data: Partial<WorkflowProtocol>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workflowProtocols).values(data as any);
  return result;
}

export async function updateWorkflowProtocol(id: number, data: Partial<WorkflowProtocol>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(workflowProtocols).set(data as any).where(eq(workflowProtocols.id, id));
}

export async function getUserWorkflowProtocols(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(workflowProtocols)
    .where(eq(workflowProtocols.userId, userId))
    .orderBy(desc(workflowProtocols.createdAt))
    .limit(limit);
}

export async function getWorkflowProtocolById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(workflowProtocols)
    .where(eq(workflowProtocols.id, id))
    .limit(1);
  return result[0];
}

// ==================== ANALYTICS ====================

export async function trackAnalyticsEvent(data: {
  userId?: number;
  sessionId?: string;
  eventType: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  eventValue?: number;
  metadata?: string;
  pageUrl?: string;
  referrer?: string;
  userAgent?: string;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(analyticsEvents).values(data as any);
}

export async function trackLLMUsage(data: {
  userId?: number;
  workflowProtocolId?: number;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
  latency?: number;
  success?: number;
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(llmUsage).values(data as any);
}

// ==================== RESEARCH QUERIES (Radar) ====================

export async function createResearchQuery(data: {
  userId: number;
  organizationId?: number;
  query: string;
  queryEmbedding?: string;
  resultSummary?: string;
  sourcesCount?: number;
  duration?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(researchQueries).values(data as any);
}

export async function getResearchQueriesByOrg(organizationId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researchQueries)
    .where(eq(researchQueries.organizationId, organizationId))
    .orderBy(desc(researchQueries.createdAt))
    .limit(limit);
}

// ==================== FALLBACK SUGGESTIONS ====================

export async function getActiveFallbackSuggestions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fallbackSuggestions)
    .where(eq(fallbackSuggestions.isActive, 1))
    .orderBy(fallbackSuggestions.displayOrder);
}

export async function getFallbackSuggestionsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(fallbackSuggestions)
    .where(and(
      eq(fallbackSuggestions.isActive, 1),
      eq(fallbackSuggestions.category, category as any)
    ))
    .orderBy(fallbackSuggestions.displayOrder)
    .limit(6);
}

// ==================== FEEDBACK ====================

export async function createSuperpromptFeedback(data: {
  superpromptId: number;
  userId: number;
  rating?: number;
  comment?: string;
  feedbackType?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(superpromptFeedback).values(data as any);
}

// ==================== SYSTEM SETTINGS ====================

export async function getSystemSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(systemSettings)
    .where(eq(systemSettings.settingKey, key))
    .limit(1);
  return result[0]?.settingValue;
}

export async function setSystemSetting(key: string, value: string, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(systemSettings)
    .values({ settingKey: key, settingValue: value, updatedBy: userId })
    .onDuplicateKeyUpdate({ set: { settingValue: value, updatedBy: userId } });
}

// ==================== ADMIN LOGS ====================

export async function createAdminLog(data: {
  userId: number;
  action: string;
  targetType?: string;
  targetId?: number;
  changes?: string;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(adminLogs).values(data as any);
}

export async function getAdminLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt)).limit(limit);
}

// ==================== DASHBOARD ANALYTICS ====================

export async function getDashboardStats(userId?: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return null;
  
  const conditions = [];
  if (userId) conditions.push(eq(workflowProtocols.userId, userId));
  if (startDate) conditions.push(gte(workflowProtocols.createdAt, startDate));
  if (endDate) conditions.push(lte(workflowProtocols.createdAt, endDate));
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const totalWorkflows = await db.select({ count: sql<number>`count(*)` })
    .from(workflowProtocols)
    .where(whereClause);
  
  const completedWorkflows = await db.select({ count: sql<number>`count(*)` })
    .from(workflowProtocols)
    .where(and(whereClause, eq(workflowProtocols.status, 'completed')));
  
  const totalCost = await db.select({ sum: sql<number>`COALESCE(SUM(cost), 0)` })
    .from(workflowProtocols)
    .where(whereClause);
  
  return {
    totalWorkflows: totalWorkflows[0]?.count || 0,
    completedWorkflows: completedWorkflows[0]?.count || 0,
    totalCost: totalCost[0]?.sum || 0,
  };
}

// ==================== CATEGORIES (Editierbar) ====================

import { categories, Category, InsertCategory, businessAreas, BusinessArea, InsertBusinessArea } from "../drizzle/schema";

export async function getAllCategories(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  
  if (includeInactive) {
    return db.select().from(categories).orderBy(categories.displayOrder);
  }
  return db.select().from(categories)
    .where(eq(categories.isActive, 1))
    .orderBy(categories.displayOrder);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return result[0];
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return result[0];
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  return result;
}

export async function updateCategory(id: number, data: Partial<Category>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(categories).set(data as any).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete - setze isActive auf 0
  return db.update(categories).set({ isActive: 0 }).where(eq(categories.id, id));
}

export async function reorderCategories(orderedIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(categories)
      .set({ displayOrder: i + 1 })
      .where(eq(categories.id, orderedIds[i]));
  }
}

// ==================== BUSINESS AREAS (Editierbar) ====================

export async function getAllBusinessAreas(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  
  if (includeInactive) {
    return db.select().from(businessAreas).orderBy(businessAreas.displayOrder);
  }
  return db.select().from(businessAreas)
    .where(eq(businessAreas.isActive, 1))
    .orderBy(businessAreas.displayOrder);
}

export async function getBusinessAreaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businessAreas)
    .where(eq(businessAreas.id, id))
    .limit(1);
  return result[0];
}

export async function getBusinessAreaBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businessAreas)
    .where(eq(businessAreas.slug, slug))
    .limit(1);
  return result[0];
}

export async function createBusinessArea(data: InsertBusinessArea) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(businessAreas).values(data);
  return result;
}

export async function updateBusinessArea(id: number, data: Partial<BusinessArea>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(businessAreas).set(data as any).where(eq(businessAreas.id, id));
}

export async function deleteBusinessArea(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete - setze isActive auf 0
  return db.update(businessAreas).set({ isActive: 0 }).where(eq(businessAreas.id, id));
}

export async function reorderBusinessAreas(orderedIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(businessAreas)
      .set({ displayOrder: i + 1 })
      .where(eq(businessAreas.id, orderedIds[i]));
  }
}
