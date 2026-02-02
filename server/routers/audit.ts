import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  users, 
  organizations, 
  organizationMembers,
  organizationSubscriptions,
  organizationTemplates,
  subscriptionPlans,
  workflowExecutions,
  workflowFeedback,
  documents,
  taskTemplates,
  processAuditLog,
  documentUsage,
  costSummary,
  adminAuditLog,
  realtimeStatsCache
} from "../../drizzle/schema";
import { eq, desc, sql, and, gte, lte, count, sum, avg, isNull, isNotNull } from "drizzle-orm";

// Helper: Nur Owner darf zugreifen
const ownerOnlyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nur für Owner zugänglich" });
  }
  return next({ ctx });
});

// Helper: Prozess-ID generieren
function generateProcessId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `KI2GO-${year}-${random}`;
}

export const auditRouter = router({
  // ==================== FIRMEN & USER ÜBERSICHT ====================
  
  // Alle Organisationen mit Details
  getOrganizations: ownerOnlyProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      status: z.enum(["all", "trial", "active", "expired"]).default("all"),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
      const { page = 1, limit = 20, search, status = "all" } = input || {};
      const offset = (page - 1) * limit;

      // Basis-Query für Organisationen
      const orgsQuery = db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          createdAt: organizations.createdAt,
        })
        .from(organizations)
        .orderBy(desc(organizations.createdAt))
        .limit(limit)
        .offset(offset);

      const orgs = await orgsQuery;

      // Für jede Organisation: Mitglieder, Subscription, Statistiken laden
      const enrichedOrgs = await Promise.all(orgs.map(async (org) => {
        // Mitglieder zählen
        const [memberCount] = await db
          .select({ count: count() })
          .from(organizationMembers)
          .where(eq(organizationMembers.organizationId, org.id));

        // Subscription laden
        const [subscription] = await db
          .select()
          .from(organizationSubscriptions)
          .where(eq(organizationSubscriptions.organizationId, org.id))
          .limit(1);

        // Ausführungen zählen
        const [execCount] = await db
          .select({ count: count() })
          .from(workflowExecutions)
          .where(eq(workflowExecutions.organizationId, org.id));

        // Gesamtkosten berechnen
        const [costs] = await db
          .select({ 
            total: sql<string>`COALESCE(SUM(${workflowExecutions.estimatedCost}), 0)` 
          })
          .from(workflowExecutions)
          .where(eq(workflowExecutions.organizationId, org.id));

        // Admins laden
        const admins = await db
          .select({
            userId: organizationMembers.userId,
            role: organizationMembers.role,
            userName: users.name,
            userEmail: users.email,
          })
          .from(organizationMembers)
          .leftJoin(users, eq(organizationMembers.userId, users.id))
          .where(and(
            eq(organizationMembers.organizationId, org.id),
            eq(organizationMembers.role, "admin")
          ));

        return {
          ...org,
          memberCount: memberCount?.count || 0,
          executionCount: execCount?.count || 0,
          totalCost: parseFloat(costs?.total || "0"),
          subscription: subscription ? {
            status: subscription.status,
            validUntil: subscription.validUntil,
            creditsUsed: subscription.creditsUsed,
            creditsTotal: subscription.creditsTotal,
          } : null,
          admins,
        };
      }));

      // Gesamtzahl
      const [totalCount] = await db
        .select({ count: count() })
        .from(organizations);

      return {
        organizations: enrichedOrgs,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit),
        },
      };
    }),

  // Alle User mit Details
  getUsers: ownerOnlyProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      organizationId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
      const { page = 1, limit = 20, search, organizationId } = input || {};
      const offset = (page - 1) * limit;

      // Basis-Query
      let query = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          organizationId: users.organizationId,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .orderBy(desc(users.lastSignedIn))
        .limit(limit)
        .offset(offset);

      const userList = await query;

      // Für jeden User: Organisation und Statistiken laden
      const enrichedUsers = await Promise.all(userList.map(async (user) => {
        // Organisation laden
        let orgName = null;
        if (user.organizationId) {
          const [org] = await db
            .select({ name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, user.organizationId))
            .limit(1);
          orgName = org?.name;
        }

        // Ausführungen zählen
        const [execCount] = await db
          .select({ count: count() })
          .from(workflowExecutions)
          .where(eq(workflowExecutions.userId, user.id));

        // Kosten berechnen
        const [costs] = await db
          .select({ 
            total: sql<string>`COALESCE(SUM(${workflowExecutions.estimatedCost}), 0)` 
          })
          .from(workflowExecutions)
          .where(eq(workflowExecutions.userId, user.id));

        // Dokumente zählen
        const [docCount] = await db
          .select({ count: count() })
          .from(documents)
          .where(eq(documents.userId, user.id));

        return {
          ...user,
          organizationName: orgName,
          executionCount: execCount?.count || 0,
          documentCount: docCount?.count || 0,
          totalCost: parseFloat(costs?.total || "0"),
        };
      }));

      // Gesamtzahl
      const [totalCount] = await db
        .select({ count: count() })
        .from(users);

      return {
        users: enrichedUsers,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit),
        },
      };
    }),

  // ==================== PROZESS-PROTOKOLL ====================

  // Alle Prozesse mit vollständigen Details
  getProcessLog: ownerOnlyProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      organizationId: z.number().optional(),
      userId: z.number().optional(),
      templateId: z.number().optional(),
      status: z.enum(["all", "completed", "failed"]).default("all"),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
      const { page = 1, limit = 20, organizationId, userId, templateId, status, dateFrom, dateTo } = input || {};
      const offset = (page - 1) * limit;

      // Alle Workflow-Ausführungen laden
      const executions = await db
        .select({
          id: workflowExecutions.id,
          sessionId: workflowExecutions.sessionId,
          userId: workflowExecutions.userId,
          organizationId: workflowExecutions.organizationId,
          templateId: workflowExecutions.templateId,
          variableValues: workflowExecutions.variableValues,
          documentIds: workflowExecutions.documentIds,
          llmModel: workflowExecutions.llmModel,
          promptTokens: workflowExecutions.promptTokens,
          completionTokens: workflowExecutions.completionTokens,
          totalTokens: workflowExecutions.totalTokens,
          executionTimeMs: workflowExecutions.executionTimeMs,
          estimatedCost: workflowExecutions.estimatedCost,
          status: workflowExecutions.status,
          errorMessage: workflowExecutions.errorMessage,
          startedAt: workflowExecutions.startedAt,
          completedAt: workflowExecutions.completedAt,
        })
        .from(workflowExecutions)
        .orderBy(desc(workflowExecutions.startedAt))
        .limit(limit)
        .offset(offset);

      // Für jede Ausführung: User, Org, Template, Feedback laden
      const enrichedExecutions = await Promise.all(executions.map(async (exec) => {
        // User laden
        const [user] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, exec.userId))
          .limit(1);

        // Organisation laden
        let orgName = null;
        if (exec.organizationId) {
          const [org] = await db
            .select({ name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, exec.organizationId))
            .limit(1);
          orgName = org?.name;
        }

        // Template laden
        const [template] = await db
          .select({ name: taskTemplates.name, title: taskTemplates.title, uniqueId: taskTemplates.uniqueId })
          .from(taskTemplates)
          .where(eq(taskTemplates.id, exec.templateId))
          .limit(1);

        // Feedback laden
        const [feedback] = await db
          .select({ rating: workflowFeedback.rating, improvementSuggestion: workflowFeedback.improvementSuggestion })
          .from(workflowFeedback)
          .where(eq(workflowFeedback.executionId, exec.id))
          .limit(1);

        // Dokumente laden
        let documentNames: string[] = [];
        if (exec.documentIds && exec.documentIds.length > 0) {
          const docs = await db
            .select({ fileName: documents.fileName, originalFileName: documents.originalFileName })
            .from(documents)
            .where(sql`${documents.id} IN (${sql.join(exec.documentIds.map(id => sql`${id}`), sql`, `)})`);
          documentNames = docs.map(d => d.originalFileName || d.fileName);
        }

        // Prozess-ID generieren (basierend auf Session-ID)
        const processId = `KI2GO-${new Date(exec.startedAt).getFullYear()}-${exec.id.toString().padStart(5, "0")}`;

        return {
          processId,
          executionId: exec.id,
          sessionId: exec.sessionId,
          
          // User & Org
          userName: user?.name || "Unbekannt",
          userEmail: user?.email,
          organizationName: orgName,
          
          // Template
          templateName: template?.title || template?.name || "Unbekannt",
          templateUniqueId: template?.uniqueId,
          
          // Dokumente
          documentNames,
          documentCount: documentNames.length,
          
          // Kosten & Tokens
          inputTokens: exec.promptTokens || 0,
          outputTokens: exec.completionTokens || 0,
          totalTokens: exec.totalTokens || 0,
          cost: parseFloat(String(exec.estimatedCost || "0")),
          llmModel: exec.llmModel,
          
          // Status & Zeit
          status: exec.status,
          errorMessage: exec.errorMessage,
          executionTimeMs: exec.executionTimeMs,
          startedAt: exec.startedAt,
          completedAt: exec.completedAt,
          
          // Feedback
          feedbackRating: feedback?.rating,
          feedbackComment: feedback?.improvementSuggestion,
        };
      }));

      // Gesamtzahl
      const [totalCount] = await db
        .select({ count: count() })
        .from(workflowExecutions);

      return {
        processes: enrichedExecutions,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit),
        },
      };
    }),

  // ==================== DOKUMENTE ====================

  // Alle Dokumente mit Nutzungs-Details
  getDocuments: ownerOnlyProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      organizationId: z.number().optional(),
      userId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
      const { page = 1, limit = 20, organizationId, userId } = input || {};
      const offset = (page - 1) * limit;

      const docs = await db
        .select({
          id: documents.id,
          userId: documents.userId,
          fileName: documents.fileName,
          originalFileName: documents.originalFileName,
          fileSize: documents.fileSize,
          mimeType: documents.mimeType,
          pageCount: documents.pageCount,
          uploadedAt: documents.uploadedAt,
        })
        .from(documents)
        .orderBy(desc(documents.uploadedAt))
        .limit(limit)
        .offset(offset);

      // Für jedes Dokument: User und Nutzung laden
      const enrichedDocs = await Promise.all(docs.map(async (doc) => {
        // User laden
        const [user] = await db
          .select({ name: users.name, email: users.email, organizationId: users.organizationId })
          .from(users)
          .where(eq(users.id, doc.userId))
          .limit(1);

        // Organisation laden
        let orgName = null;
        if (user?.organizationId) {
          const [org] = await db
            .select({ name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, user.organizationId))
            .limit(1);
          orgName = org?.name;
        }

        // In wie vielen Aufgaben verwendet
        const [usageCount] = await db
          .select({ count: count() })
          .from(workflowExecutions)
          .where(sql`JSON_CONTAINS(${workflowExecutions.documentIds}, ${doc.id})`);

        return {
          ...doc,
          userName: user?.name || "Unbekannt",
          userEmail: user?.email,
          organizationName: orgName,
          usageCount: usageCount?.count || 0,
        };
      }));

      // Gesamtzahl
      const [totalCount] = await db
        .select({ count: count() })
        .from(documents);

      return {
        documents: enrichedDocs,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit),
        },
      };
    }),

  // ==================== KOSTEN-ANALYTICS ====================

  // Kosten-Übersicht
  getCostAnalytics: ownerOnlyProcedure
    .input(z.object({
      period: z.enum(["day", "week", "month", "year"]).default("month"),
      organizationId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
      const { period = "month", organizationId } = input || {};

      // Zeitraum berechnen
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case "day":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      // Gesamtkosten
      const [totalCosts] = await db
        .select({
          totalCost: sql<string>`COALESCE(SUM(${workflowExecutions.estimatedCost}), 0)`,
          totalTokens: sql<number>`COALESCE(SUM(${workflowExecutions.totalTokens}), 0)`,
          executionCount: count(),
        })
        .from(workflowExecutions)
        .where(gte(workflowExecutions.startedAt, startDate));

      // Kosten pro Organisation
      const costsByOrg = await db
        .select({
          organizationId: workflowExecutions.organizationId,
          totalCost: sql<string>`COALESCE(SUM(${workflowExecutions.estimatedCost}), 0)`,
          executionCount: count(),
        })
        .from(workflowExecutions)
        .where(gte(workflowExecutions.startedAt, startDate))
        .groupBy(workflowExecutions.organizationId);

      // Organisation-Namen hinzufügen
      const costsByOrgWithNames = await Promise.all(costsByOrg.map(async (item) => {
        let orgName = "Ohne Organisation";
        if (item.organizationId) {
          const [org] = await db
            .select({ name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, item.organizationId))
            .limit(1);
          orgName = org?.name || "Unbekannt";
        }
        return {
          organizationId: item.organizationId,
          organizationName: orgName,
          totalCost: parseFloat(item.totalCost),
          executionCount: item.executionCount,
        };
      }));

      // Kosten pro Template
      const costsByTemplate = await db
        .select({
          templateId: workflowExecutions.templateId,
          totalCost: sql<string>`COALESCE(SUM(${workflowExecutions.estimatedCost}), 0)`,
          executionCount: count(),
          avgCost: sql<string>`COALESCE(AVG(${workflowExecutions.estimatedCost}), 0)`,
        })
        .from(workflowExecutions)
        .where(gte(workflowExecutions.startedAt, startDate))
        .groupBy(workflowExecutions.templateId)
        .orderBy(sql`SUM(${workflowExecutions.estimatedCost}) DESC`)
        .limit(10);

      // Template-Namen hinzufügen
      const costsByTemplateWithNames = await Promise.all(costsByTemplate.map(async (item) => {
        const [template] = await db
          .select({ name: taskTemplates.name, title: taskTemplates.title })
          .from(taskTemplates)
          .where(eq(taskTemplates.id, item.templateId))
          .limit(1);
        return {
          templateId: item.templateId,
          templateName: template?.title || template?.name || "Unbekannt",
          totalCost: parseFloat(item.totalCost),
          avgCost: parseFloat(item.avgCost),
          executionCount: item.executionCount,
        };
      }));

      // Durchschnittliche Kosten pro Ausführung
      const avgCostPerExecution = totalCosts?.executionCount > 0
        ? parseFloat(totalCosts.totalCost) / totalCosts.executionCount
        : 0;

      return {
        period,
        startDate,
        endDate: now,
        summary: {
          totalCost: parseFloat(totalCosts?.totalCost || "0"),
          totalTokens: totalCosts?.totalTokens || 0,
          executionCount: totalCosts?.executionCount || 0,
          avgCostPerExecution,
        },
        byOrganization: costsByOrgWithNames.sort((a, b) => b.totalCost - a.totalCost),
        byTemplate: costsByTemplateWithNames,
      };
    }),

  // ==================== ECHTZEIT-STATISTIKEN ====================

  // Dashboard-Statistiken
  getRealtimeStats: ownerOnlyProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Gesamt-Statistiken
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalOrgs] = await db.select({ count: count() }).from(organizations);
    const [totalExecutions] = await db.select({ count: count() }).from(workflowExecutions);
    const [totalDocuments] = await db.select({ count: count() }).from(documents);

    // Heute
    const [todayExecutions] = await db
      .select({ count: count() })
      .from(workflowExecutions)
      .where(gte(workflowExecutions.startedAt, today));

    const [todayCost] = await db
      .select({ total: sql<string>`COALESCE(SUM(${workflowExecutions.estimatedCost}), 0)` })
      .from(workflowExecutions)
      .where(gte(workflowExecutions.startedAt, today));

    // Diese Woche
    const [weekExecutions] = await db
      .select({ count: count() })
      .from(workflowExecutions)
      .where(gte(workflowExecutions.startedAt, thisWeek));

    const [weekCost] = await db
      .select({ total: sql<string>`COALESCE(SUM(${workflowExecutions.estimatedCost}), 0)` })
      .from(workflowExecutions)
      .where(gte(workflowExecutions.startedAt, thisWeek));

    // Dieser Monat
    const [monthExecutions] = await db
      .select({ count: count() })
      .from(workflowExecutions)
      .where(gte(workflowExecutions.startedAt, thisMonth));

    const [monthCost] = await db
      .select({ total: sql<string>`COALESCE(SUM(${workflowExecutions.estimatedCost}), 0)` })
      .from(workflowExecutions)
      .where(gte(workflowExecutions.startedAt, thisMonth));

    // Fehler-Rate (letzte 7 Tage)
    const [failedExecutions] = await db
      .select({ count: count() })
      .from(workflowExecutions)
      .where(and(
        gte(workflowExecutions.startedAt, thisWeek),
        eq(workflowExecutions.status, "failed")
      ));

    const errorRate = weekExecutions?.count > 0
      ? (failedExecutions?.count || 0) / weekExecutions.count * 100
      : 0;

    // Aktive User (letzte 24h)
    const [activeUsers] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${workflowExecutions.userId})` })
      .from(workflowExecutions)
      .where(gte(workflowExecutions.startedAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)));

    // Laufende Aufgaben
    const [runningTasks] = await db
      .select({ count: count() })
      .from(workflowExecutions)
      .where(eq(workflowExecutions.status, "processing"));

    // Ablaufende Subscriptions (nächste 14 Tage)
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const [expiringSubscriptions] = await db
      .select({ count: count() })
      .from(organizationSubscriptions)
      .where(and(
        lte(organizationSubscriptions.validUntil, in14Days),
        gte(organizationSubscriptions.validUntil, now)
      ));

    return {
      totals: {
        users: totalUsers?.count || 0,
        organizations: totalOrgs?.count || 0,
        executions: totalExecutions?.count || 0,
        documents: totalDocuments?.count || 0,
      },
      today: {
        executions: todayExecutions?.count || 0,
        cost: parseFloat(todayCost?.total || "0"),
      },
      thisWeek: {
        executions: weekExecutions?.count || 0,
        cost: parseFloat(weekCost?.total || "0"),
      },
      thisMonth: {
        executions: monthExecutions?.count || 0,
        cost: parseFloat(monthCost?.total || "0"),
      },
      realtime: {
        activeUsers24h: activeUsers?.count || 0,
        runningTasks: runningTasks?.count || 0,
        errorRate: Math.round(errorRate * 100) / 100,
        expiringSubscriptions: expiringSubscriptions?.count || 0,
      },
    };
  }),

  // ==================== EXPORT ====================

  // Daten exportieren
  exportData: ownerOnlyProcedure
    .input(z.object({
      type: z.enum(["processes", "users", "organizations", "documents", "costs"]),
      format: z.enum(["json", "csv"]).default("json"),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      organizationId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
      const { type, format, dateFrom, dateTo, organizationId } = input;

      let data: any[] = [];

      switch (type) {
        case "processes":
          data = await db
            .select({
              id: workflowExecutions.id,
              sessionId: workflowExecutions.sessionId,
              userId: workflowExecutions.userId,
              organizationId: workflowExecutions.organizationId,
              templateId: workflowExecutions.templateId,
              promptTokens: workflowExecutions.promptTokens,
              completionTokens: workflowExecutions.completionTokens,
              totalTokens: workflowExecutions.totalTokens,
              estimatedCost: workflowExecutions.estimatedCost,
              status: workflowExecutions.status,
              startedAt: workflowExecutions.startedAt,
              completedAt: workflowExecutions.completedAt,
            })
            .from(workflowExecutions)
            .orderBy(desc(workflowExecutions.startedAt))
            .limit(10000);
          break;

        case "users":
          data = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              role: users.role,
              organizationId: users.organizationId,
              createdAt: users.createdAt,
              lastSignedIn: users.lastSignedIn,
            })
            .from(users)
            .orderBy(desc(users.createdAt));
          break;

        case "organizations":
          data = await db
            .select()
            .from(organizations)
            .orderBy(desc(organizations.createdAt));
          break;

        case "documents":
          data = await db
            .select({
              id: documents.id,
              userId: documents.userId,
              fileName: documents.fileName,
              originalFileName: documents.originalFileName,
              fileSize: documents.fileSize,
              mimeType: documents.mimeType,
              uploadedAt: documents.uploadedAt,
            })
            .from(documents)
            .orderBy(desc(documents.uploadedAt));
          break;

        case "costs":
          data = await db
            .select({
              id: workflowExecutions.id,
              organizationId: workflowExecutions.organizationId,
              templateId: workflowExecutions.templateId,
              promptTokens: workflowExecutions.promptTokens,
              completionTokens: workflowExecutions.completionTokens,
              totalTokens: workflowExecutions.totalTokens,
              estimatedCost: workflowExecutions.estimatedCost,
              startedAt: workflowExecutions.startedAt,
            })
            .from(workflowExecutions)
            .orderBy(desc(workflowExecutions.startedAt))
            .limit(10000);
          break;
      }

      if (format === "csv") {
        // CSV-Format
        if (data.length === 0) return { data: "", format: "csv" };
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(row => 
          Object.values(row).map(v => 
            typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v
          ).join(",")
        );
        return { data: [headers, ...rows].join("\n"), format: "csv" };
      }

      return { data: JSON.stringify(data, null, 2), format: "json" };
    }),

  // ==================== ERGEBNIS-DETAILS ====================

  // Einzelnes Ergebnis mit allen Details abrufen
  getExecutionDetails: ownerOnlyProcedure
    .input(z.object({
      executionId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Ausführung laden
      const [execution] = await db
        .select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.id, input.executionId))
        .limit(1);

      if (!execution) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ausführung nicht gefunden" });
      }

      // User laden
      const [user] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, execution.userId))
        .limit(1);

      // Organisation laden
      let orgName = null;
      if (execution.organizationId) {
        const [org] = await db
          .select({ name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, execution.organizationId))
          .limit(1);
        orgName = org?.name;
      }

      // Template laden
      const [template] = await db
        .select({ 
          name: taskTemplates.name, 
          title: taskTemplates.title, 
          uniqueId: taskTemplates.uniqueId,
          categoryId: taskTemplates.categoryId,
        })
        .from(taskTemplates)
        .where(eq(taskTemplates.id, execution.templateId))
        .limit(1);

      // Dokumente laden
      let documentDetails: Array<{
        id: number;
        fileName: string;
        originalFileName: string | null;
        fileUrl: string | null;
        mimeType: string | null;
        fileSize: number | null;
      }> = [];
      
      if (execution.documentIds && Array.isArray(execution.documentIds) && execution.documentIds.length > 0) {
        const docs = await db
          .select({
            id: documents.id,
            fileName: documents.fileName,
            originalFileName: documents.originalFileName,
            fileUrl: documents.fileUrl,
            mimeType: documents.mimeType,
            fileSize: documents.fileSize,
          })
          .from(documents)
          .where(sql`${documents.id} IN (${sql.join(execution.documentIds.map((id: number) => sql`${id}`), sql`, `)})`);
        documentDetails = docs;
      }

      // Feedback laden
      const [feedback] = await db
        .select()
        .from(workflowFeedback)
        .where(eq(workflowFeedback.executionId, execution.id))
        .limit(1);

      // Prozess-ID generieren
      const processId = `KI2GO-${new Date(execution.startedAt).getFullYear()}-${execution.id.toString().padStart(5, "0")}`;

      return {
        processId,
        executionId: execution.id,
        sessionId: execution.sessionId,
        
        // User & Organisation
        user: {
          name: user?.name || "Unbekannt",
          email: user?.email,
        },
        organization: orgName,
        
        // Template
        template: {
          id: execution.templateId,
          name: template?.title || template?.name || "Unbekannt",
          uniqueId: template?.uniqueId,
          categoryId: template?.categoryId,
        },
        
        // Input-Daten
        variableValues: execution.variableValues,
        superpromptUsed: execution.superpromptUsed,
        
        // Dokumente
        documents: documentDetails,
        
        // Ergebnis
        result: execution.result,
        resultFormat: execution.resultFormat,
        
        // Kosten & Performance
        llmModel: execution.llmModel,
        llmTemperature: execution.llmTemperature,
        promptTokens: execution.promptTokens,
        completionTokens: execution.completionTokens,
        totalTokens: execution.totalTokens,
        estimatedCost: parseFloat(String(execution.estimatedCost || "0")),
        executionTimeMs: execution.executionTimeMs,
        
        // Status
        status: execution.status,
        errorMessage: execution.errorMessage,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        
        // Feedback
        feedback: feedback ? {
          rating: feedback.rating,
          comment: feedback.improvementSuggestion,
          createdAt: feedback.createdAt,
        } : null,
      };
    }),

  // Alle Dokumente mit Download-URLs
  getAllDocuments: ownerOnlyProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
      search: z.string().optional(),
      userId: z.number().optional(),
      organizationId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
      const { page = 1, limit = 50, search, userId, organizationId } = input || {};
      const offset = (page - 1) * limit;

      // Dokumente laden
      const docs = await db
        .select({
          id: documents.id,
          userId: documents.userId,
          fileName: documents.fileName,
          originalFileName: documents.originalFileName,
          fileUrl: documents.fileUrl,
          fileSize: documents.fileSize,
          mimeType: documents.mimeType,
          pageCount: documents.pageCount,
          uploadedAt: documents.uploadedAt,
        })
        .from(documents)
        .orderBy(desc(documents.uploadedAt))
        .limit(limit)
        .offset(offset);

      // Für jedes Dokument: User, Organisation und Nutzung laden
      const enrichedDocs = await Promise.all(docs.map(async (doc) => {
        // User laden
        const [user] = await db
          .select({ 
            name: users.name, 
            email: users.email, 
            organizationId: users.organizationId 
          })
          .from(users)
          .where(eq(users.id, doc.userId))
          .limit(1);

        // Organisation laden
        let orgName = null;
        if (user?.organizationId) {
          const [org] = await db
            .select({ name: organizations.name })
            .from(organizations)
            .where(eq(organizations.id, user.organizationId))
            .limit(1);
          orgName = org?.name;
        }

        // In welchen Ausführungen verwendet
        const executions = await db
          .select({
            id: workflowExecutions.id,
            templateId: workflowExecutions.templateId,
            startedAt: workflowExecutions.startedAt,
          })
          .from(workflowExecutions)
          .where(sql`JSON_CONTAINS(${workflowExecutions.documentIds}, CAST(${doc.id} AS JSON))`)
          .orderBy(desc(workflowExecutions.startedAt))
          .limit(5);

        return {
          id: doc.id,
          fileName: doc.fileName,
          originalFileName: doc.originalFileName,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          pageCount: doc.pageCount,
          uploadedAt: doc.uploadedAt,
          
          // User & Organisation
          user: {
            id: doc.userId,
            name: user?.name || "Unbekannt",
            email: user?.email,
          },
          organization: orgName,
          
          // Nutzung
          usageCount: executions.length,
          recentUsages: executions.map(e => ({
            executionId: e.id,
            templateId: e.templateId,
            usedAt: e.startedAt,
          })),
        };
      }));

      // Gesamtzahl
      const [totalCount] = await db
        .select({ count: count() })
        .from(documents);

      return {
        documents: enrichedDocs,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit),
        },
      };
    }),

  // Einzelnes Dokument mit Details
  getDocumentDetails: ownerOnlyProcedure
    .input(z.object({
      documentId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Dokument laden
      const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, input.documentId))
        .limit(1);

      if (!doc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dokument nicht gefunden" });
      }

      // User laden
      const [user] = await db
        .select({ 
          name: users.name, 
          email: users.email, 
          organizationId: users.organizationId 
        })
        .from(users)
        .where(eq(users.id, doc.userId))
        .limit(1);

      // Organisation laden
      let orgName = null;
      if (user?.organizationId) {
        const [org] = await db
          .select({ name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, user.organizationId))
          .limit(1);
        orgName = org?.name;
      }

      // Alle Ausführungen, in denen das Dokument verwendet wurde
      const executions = await db
        .select({
          id: workflowExecutions.id,
          templateId: workflowExecutions.templateId,
          status: workflowExecutions.status,
          startedAt: workflowExecutions.startedAt,
          completedAt: workflowExecutions.completedAt,
        })
        .from(workflowExecutions)
        .where(sql`JSON_CONTAINS(${workflowExecutions.documentIds}, CAST(${doc.id} AS JSON))`)
        .orderBy(desc(workflowExecutions.startedAt));

      // Template-Namen für Ausführungen laden
      const executionsWithTemplates = await Promise.all(executions.map(async (exec) => {
        const [template] = await db
          .select({ name: taskTemplates.name, title: taskTemplates.title })
          .from(taskTemplates)
          .where(eq(taskTemplates.id, exec.templateId))
          .limit(1);
        
        return {
          executionId: exec.id,
          templateName: template?.title || template?.name || "Unbekannt",
          status: exec.status,
          startedAt: exec.startedAt,
          completedAt: exec.completedAt,
          processId: `KI2GO-${new Date(exec.startedAt).getFullYear()}-${exec.id.toString().padStart(5, "0")}`,
        };
      }));

      return {
        id: doc.id,
        fileName: doc.fileName,
        originalFileName: doc.originalFileName,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        pageCount: doc.pageCount,
        extractedText: doc.extractedText,
        uploadedAt: doc.uploadedAt,
        
        // User & Organisation
        user: {
          id: doc.userId,
          name: user?.name || "Unbekannt",
          email: user?.email,
        },
        organization: orgName,
        
        // Nutzungshistorie
        usageHistory: executionsWithTemplates,
        totalUsageCount: executionsWithTemplates.length,
      };
    }),

  // ==================== USER BEARBEITUNG ====================
  
  // User bearbeiten (Rolle, Organisation)
  updateUser: ownerOnlyProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]).optional(),
      organizationId: z.number().nullable().optional(),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const updateData: Record<string, unknown> = {};
      if (input.role !== undefined) updateData.role = input.role;
      if (input.organizationId !== undefined) updateData.organizationId = input.organizationId;
      if (input.name !== undefined) updateData.name = input.name;

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Keine Änderungen angegeben" });
      }

      await db.update(users).set(updateData).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // User einer Organisation zuweisen
  assignUserToOrganization: ownerOnlyProcedure
    .input(z.object({
      userId: z.number(),
      organizationId: z.number(),
      role: z.enum(["member", "admin"]).default("member"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // User der Organisation zuweisen
      await db.update(users).set({ organizationId: input.organizationId }).where(eq(users.id, input.userId));
      
      // Prüfen ob bereits Mitglied
      const [existing] = await db
        .select()
        .from(organizationMembers)
        .where(and(
          eq(organizationMembers.userId, input.userId),
          eq(organizationMembers.organizationId, input.organizationId)
        ))
        .limit(1);

      if (!existing) {
        // Als Mitglied hinzufügen
        await db.insert(organizationMembers).values({
          userId: input.userId,
          organizationId: input.organizationId,
          role: input.role,
        });
      }

      return { success: true };
    }),

  // User aus Organisation entfernen
  removeUserFromOrganization: ownerOnlyProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // User aus Organisation entfernen
      await db.update(users).set({ organizationId: null }).where(eq(users.id, input.userId));
      
      // Mitgliedschaft löschen
      await db.delete(organizationMembers).where(eq(organizationMembers.userId, input.userId));

      return { success: true };
    }),

  // ==================== FIRMEN VERWALTUNG ====================
  
  // Neue Firma manuell anlegen
  createOrganization: ownerOnlyProcedure
    .input(z.object({
      name: z.string().min(1),
      industry: z.string().optional(),
      employeeCount: z.string().optional(),
      adminUserId: z.number().optional(),
      trialDays: z.number().default(90),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const slug = input.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

      const [result] = await db.insert(organizations).values({
        name: input.name,
        slug,
        ownerId: ctx.user.id,
        settings: JSON.stringify({
          industry: input.industry,
          employeeCount: input.employeeCount,
        }),
      });

      const orgId = result.insertId;

      // Test-Plan finden oder erstellen
      let [testPlan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, "Test-Paket"))
        .limit(1);

      if (!testPlan) {
        const [planResult] = await db.insert(subscriptionPlans).values({
          name: "Test-Paket",
          slug: "test-paket",
          description: "Kostenlose Testphase",
          priceMonthly: "0",
          userLimit: 100,
          creditLimit: 1000,
          trialDays: input.trialDays,
          isTrialPlan: 1,
          isActive: 1,
        });
        [testPlan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planResult.insertId)).limit(1);
      }

      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + input.trialDays);

      await db.insert(organizationSubscriptions).values({
        organizationId: Number(orgId),
        planId: testPlan.id,
        status: "trial",
        validUntil,
        creditsUsed: 0,
        creditsTotal: testPlan.creditLimit || 1000,
      });

      if (input.adminUserId) {
        await db.update(users).set({ 
          organizationId: Number(orgId),
          role: "admin"
        }).where(eq(users.id, input.adminUserId));

        await db.insert(organizationMembers).values({
          userId: input.adminUserId,
          organizationId: Number(orgId),
          role: "admin",
        });
      }

      // Alle aktiven Templates zuweisen
      const activeTemplates = await db
        .select({ id: taskTemplates.id })
        .from(taskTemplates)
        .where(eq(taskTemplates.status, "active"));

      for (const template of activeTemplates) {
        await db.insert(organizationTemplates).values({
          organizationId: Number(orgId),
          templateId: template.id,
        }).onDuplicateKeyUpdate({ set: { templateId: template.id } });
      }

      return { success: true, organizationId: Number(orgId) };
    }),

  // Firma bearbeiten
  updateOrganization: ownerOnlyProcedure
    .input(z.object({
      organizationId: z.number(),
      name: z.string().optional(),
      industry: z.string().optional(),
      employeeCount: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const updateData: Record<string, unknown> = {};
      if (input.name) {
        updateData.name = input.name;
        updateData.slug = input.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      }

      const [org] = await db.select().from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
      if (org) {
        const settings = org.settings ? JSON.parse(org.settings) : {};
        if (input.industry !== undefined) settings.industry = input.industry;
        if (input.employeeCount !== undefined) settings.employeeCount = input.employeeCount;
        updateData.settings = JSON.stringify(settings);
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(organizations).set(updateData).where(eq(organizations.id, input.organizationId));
      }

      return { success: true };
    }),

  // Subscription verlängern
  extendSubscription: ownerOnlyProcedure
    .input(z.object({
      organizationId: z.number(),
      days: z.number().min(1).default(30),
      additionalCredits: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const [sub] = await db
        .select()
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.organizationId, input.organizationId))
        .limit(1);

      if (!sub) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Keine Subscription gefunden" });
      }

      const newValidUntil = new Date(sub.validUntil);
      newValidUntil.setDate(newValidUntil.getDate() + input.days);

      await db.update(organizationSubscriptions)
        .set({
          validUntil: newValidUntil,
          creditsTotal: (sub.creditsTotal || 0) + input.additionalCredits,
          status: "active",
        })
        .where(eq(organizationSubscriptions.id, sub.id));

      return { success: true, newValidUntil };
    }),

  // Alle User einer Organisation laden
  getOrganizationUsers: ownerOnlyProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const orgUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .where(eq(users.organizationId, input.organizationId))
        .orderBy(users.name);

      return orgUsers;
    }),
});
