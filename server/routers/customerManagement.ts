import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  organizations,
  organizationMembers,
  organizationSubscriptions,
  organizationTemplates,
  customSuperprompts,
  subscriptionPlans,
  workflowExecutions,
  usageTracking,
  categories,
  businessAreas,
  taskTemplates,
} from "../../drizzle/schema";
import { eq, desc, sql, and, count, sum, gte, lte } from "drizzle-orm";

// Helper: Nur Owner darf zugreifen
const ownerOnlyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nur für Owner zugänglich" });
  }
  return next({ ctx });
});

// Helper: Aktuellen Monat als String (YYYY-MM)
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Helper: Letzte N Monate als Array
function getLastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

export const customerManagementRouter = router({
  // ==================== KUNDEN-ÜBERSICHT ====================

  // Alle Kunden mit KPIs
  getCustomers: ownerOnlyProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      planFilter: z.string().optional(), // basic, pro, enterprise
      statusFilter: z.enum(["all", "trial", "active", "expired"]).default("all"),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
      
      const { page = 1, limit = 20, search, planFilter, statusFilter = "all" } = input || {};
      const offset = (page - 1) * limit;
      const currentMonth = getCurrentMonth();

      // Alle Organisationen laden
      const orgs = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          customerNumber: organizations.customerNumber,
          industry: organizations.industry,
          employeeCount: organizations.employeeCount,
          createdAt: organizations.createdAt,
        })
        .from(organizations)
        .orderBy(desc(organizations.createdAt))
        .limit(limit)
        .offset(offset);

      // Für jede Organisation: Details laden
      const enrichedCustomers = await Promise.all(orgs.map(async (org) => {
        // Mitglieder zählen
        const [memberCount] = await db
          .select({ count: count() })
          .from(organizationMembers)
          .where(eq(organizationMembers.organizationId, org.id));

        // Subscription laden
        const [subscription] = await db
          .select({
            id: organizationSubscriptions.id,
            planId: organizationSubscriptions.planId,
            status: organizationSubscriptions.status,
            validUntil: organizationSubscriptions.validUntil,
            creditsUsed: organizationSubscriptions.creditsUsed,
            creditsTotal: organizationSubscriptions.creditsTotal,
          })
          .from(organizationSubscriptions)
          .where(eq(organizationSubscriptions.organizationId, org.id))
          .limit(1);

        // Plan-Details laden
        let planDetails = null;
        if (subscription?.planId) {
          const [plan] = await db
            .select({
              id: subscriptionPlans.id,
              name: subscriptionPlans.name,
              slug: subscriptionPlans.slug,
            })
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, subscription.planId))
            .limit(1);
          planDetails = plan;
        }

        // Nutzung diesen Monat
        const [monthlyUsage] = await db
          .select({
            tasksUsed: sql<number>`COALESCE(SUM(${usageTracking.tasksUsed}), 0)`,
            totalCostEur: sql<string>`COALESCE(SUM(${usageTracking.totalCostEur}), 0)`,
          })
          .from(usageTracking)
          .where(and(
            eq(usageTracking.organizationId, org.id),
            eq(usageTracking.periodMonth, currentMonth)
          ));

        // Gesamtkosten berechnen
        const [totalCosts] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${workflowExecutions.estimatedCost}), 0)`,
          })
          .from(workflowExecutions)
          .where(eq(workflowExecutions.organizationId, org.id));

        // Aktivierte Templates zählen
        const [templateCount] = await db
          .select({ count: count() })
          .from(organizationTemplates)
          .where(eq(organizationTemplates.organizationId, org.id));

        // Custom Templates zählen
        const [customTemplateCount] = await db
          .select({ count: count() })
          .from(customSuperprompts)
          .where(eq(customSuperprompts.organizationId, org.id));

        // Letzte Aktivität
        const [lastActivity] = await db
          .select({ completedAt: workflowExecutions.completedAt })
          .from(workflowExecutions)
          .where(eq(workflowExecutions.organizationId, org.id))
          .orderBy(desc(workflowExecutions.completedAt))
          .limit(1);

        return {
          ...org,
          memberCount: memberCount?.count || 0,
          subscription: subscription ? {
            ...subscription,
            plan: planDetails,
          } : null,
          usage: {
            tasksThisMonth: monthlyUsage?.tasksUsed || 0,
            costThisMonth: parseFloat(String(monthlyUsage?.totalCostEur || 0)),
            totalCost: parseFloat(totalCosts?.total || "0"),
          },
          templates: {
            activated: templateCount?.count || 0,
            custom: customTemplateCount?.count || 0,
          },
          lastActivity: lastActivity?.completedAt || null,
        };
      }));

      // Gesamtzahl
      const [totalCount] = await db
        .select({ count: count() })
        .from(organizations);

      return {
        customers: enrichedCustomers,
        pagination: {
          page,
          limit,
          total: totalCount?.count || 0,
          totalPages: Math.ceil((totalCount?.count || 0) / limit),
        },
      };
    }),

  // ==================== KUNDEN-DETAIL ====================

  // Einzelner Kunde mit allen Details
  getCustomerById: ownerOnlyProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { organizationId } = input;

      // Organisation laden
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kunde nicht gefunden" });
      }

      // Subscription mit Plan
      const [subscription] = await db
        .select()
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.organizationId, organizationId))
        .limit(1);

      let plan = null;
      if (subscription?.planId) {
        const [planData] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.id, subscription.planId))
          .limit(1);
        plan = planData;
      }

      // KPIs berechnen
      const currentMonth = getCurrentMonth();
      
      const [memberCount] = await db
        .select({ count: count() })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, organizationId));

      const [monthlyUsage] = await db
        .select({
          tasksUsed: sql<number>`COALESCE(SUM(${usageTracking.tasksUsed}), 0)`,
          inputTokens: sql<number>`COALESCE(SUM(${usageTracking.inputTokens}), 0)`,
          outputTokens: sql<number>`COALESCE(SUM(${usageTracking.outputTokens}), 0)`,
          totalCostEur: sql<string>`COALESCE(SUM(${usageTracking.totalCostEur}), 0)`,
        })
        .from(usageTracking)
        .where(and(
          eq(usageTracking.organizationId, organizationId),
          eq(usageTracking.periodMonth, currentMonth)
        ));

      const [allTimeUsage] = await db
        .select({
          tasksUsed: sql<number>`COALESCE(SUM(${usageTracking.tasksUsed}), 0)`,
          totalCostEur: sql<string>`COALESCE(SUM(${usageTracking.totalCostEur}), 0)`,
        })
        .from(usageTracking)
        .where(eq(usageTracking.organizationId, organizationId));

      const [templateCount] = await db
        .select({ count: count() })
        .from(organizationTemplates)
        .where(eq(organizationTemplates.organizationId, organizationId));

      const [customTemplateCount] = await db
        .select({ count: count() })
        .from(customSuperprompts)
        .where(eq(customSuperprompts.organizationId, organizationId));

      return {
        organization: org,
        subscription: subscription ? { ...subscription, plan } : null,
        kpis: {
          memberCount: memberCount?.count || 0,
          currentMonth: {
            tasksUsed: monthlyUsage?.tasksUsed || 0,
            inputTokens: monthlyUsage?.inputTokens || 0,
            outputTokens: monthlyUsage?.outputTokens || 0,
            totalCostEur: parseFloat(String(monthlyUsage?.totalCostEur || 0)),
          },
          allTime: {
            tasksUsed: allTimeUsage?.tasksUsed || 0,
            totalCostEur: parseFloat(String(allTimeUsage?.totalCostEur || 0)),
          },
          templates: {
            activated: templateCount?.count || 0,
            custom: customTemplateCount?.count || 0,
          },
        },
      };
    }),

  // ==================== MITARBEITER-VERWALTUNG ====================

  // Mitarbeiter eines Kunden mit Abteilungs-Zuordnung
  getCustomerMembers: ownerOnlyProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { organizationId } = input;
      const currentMonth = getCurrentMonth();

      // Alle Mitglieder mit User-Details
      const members = await db
        .select({
          memberId: organizationMembers.id,
          memberRole: organizationMembers.role,
          joinedAt: organizationMembers.joinedAt,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          userStatus: users.status,
          categoryId: users.categoryId,
          businessAreaId: users.businessAreaId,
          lastSignedIn: users.lastSignedIn,
        })
        .from(organizationMembers)
        .leftJoin(users, eq(organizationMembers.userId, users.id))
        .where(eq(organizationMembers.organizationId, organizationId));

      // Für jeden Mitarbeiter: Nutzung und Abteilungs-Namen laden
      const enrichedMembers = await Promise.all(members.map(async (member) => {
        // Kategorie laden
        let categoryName = null;
        if (member.categoryId) {
          const [cat] = await db
            .select({ name: categories.name })
            .from(categories)
            .where(eq(categories.id, member.categoryId))
            .limit(1);
          categoryName = cat?.name;
        }

        // Unternehmensbereich laden
        let businessAreaName = null;
        if (member.businessAreaId) {
          const [area] = await db
            .select({ name: businessAreas.name })
            .from(businessAreas)
            .where(eq(businessAreas.id, member.businessAreaId))
            .limit(1);
          businessAreaName = area?.name;
        }

        // Nutzung diesen Monat
        const [usage] = await db
          .select({
            tasksUsed: usageTracking.tasksUsed,
            totalCostEur: usageTracking.totalCostEur,
          })
          .from(usageTracking)
          .where(and(
            eq(usageTracking.userId, member.userId!),
            eq(usageTracking.periodMonth, currentMonth)
          ))
          .limit(1);

        // Letzte Ausführung
        const [lastExecution] = await db
          .select({ completedAt: workflowExecutions.completedAt })
          .from(workflowExecutions)
          .where(eq(workflowExecutions.userId, member.userId!))
          .orderBy(desc(workflowExecutions.completedAt))
          .limit(1);

        // Inaktiv-Status berechnen (30+ Tage)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const isInactive = !lastExecution?.completedAt || 
          new Date(lastExecution.completedAt) < thirtyDaysAgo;

        return {
          id: member.memberId,
          userId: member.userId,
          name: member.userName || "Unbekannt",
          email: member.userEmail || "",
          role: member.memberRole,
          status: member.userStatus,
          joinedAt: member.joinedAt,
          lastSignedIn: member.lastSignedIn,
          lastExecution: lastExecution?.completedAt || null,
          isInactive,
          department: {
            categoryId: member.categoryId,
            categoryName,
            businessAreaId: member.businessAreaId,
            businessAreaName,
          },
          usage: {
            tasksThisMonth: usage?.tasksUsed || 0,
            costThisMonth: parseFloat(String(usage?.totalCostEur || 0)),
          },
        };
      }));

      return enrichedMembers;
    }),

  // Mitarbeiter Abteilung zuweisen
  updateMemberDepartment: ownerOnlyProcedure
    .input(z.object({
      userId: z.number(),
      categoryId: z.number().nullable(),
      businessAreaId: z.number().nullable(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { userId, categoryId, businessAreaId } = input;

      await db
        .update(users)
        .set({
          categoryId,
          businessAreaId,
        })
        .where(eq(users.id, userId));

      return { success: true };
    }),

  // ==================== NUTZUNGSSTATISTIKEN ====================

  // Nutzungs-Trends (letzte 6 Monate)
  getCustomerUsageTrends: ownerOnlyProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { organizationId } = input;
      const months = getLastNMonths(6);

      const trends = await Promise.all(
        months.map(async (month) => {
          const [usage] = await db
            .select({
              tasksUsed: sql<number>`COALESCE(SUM(${usageTracking.tasksUsed}), 0)`,
              totalCostEur: sql<string>`COALESCE(SUM(${usageTracking.totalCostEur}), 0)`,
            })
            .from(usageTracking)
            .where(and(
              eq(usageTracking.organizationId, organizationId),
              eq(usageTracking.periodMonth, month)
            ));

          return {
            month,
            tasksUsed: usage?.tasksUsed || 0,
            totalCostEur: parseFloat(String(usage?.totalCostEur || 0)),
          };
        })
      );

      return trends.reverse(); // Älteste zuerst
    }),

  // Top-Templates des Kunden
  getCustomerTopTemplates: ownerOnlyProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { organizationId } = input;

      // Top 10 Templates nach Nutzung
      const topTemplates = await db
        .select({
          templateId: workflowExecutions.templateId,
          count: sql<number>`COUNT(*)`,
        })
        .from(workflowExecutions)
        .where(eq(workflowExecutions.organizationId, organizationId))
        .groupBy(workflowExecutions.templateId)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(10);

      // Template-Details laden
      const enrichedTemplates = await Promise.all(
        topTemplates.map(async (t) => {
          if (!t.templateId) return { ...t, name: "Unbekannt", slug: null };
          
          const [template] = await db
            .select({ name: taskTemplates.name, slug: taskTemplates.slug })
            .from(taskTemplates)
            .where(eq(taskTemplates.id, t.templateId))
            .limit(1);

          return {
            templateId: t.templateId,
            count: t.count,
            name: template?.name || "Unbekannt",
            slug: template?.slug,
          };
        })
      );

      return enrichedTemplates;
    }),

  // ==================== TEMPLATE-VERWALTUNG ====================

  // Aktivierte Templates des Kunden
  getCustomerTemplates: ownerOnlyProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { organizationId } = input;

      // Aktivierte Templates
      const activated = await db
        .select({
          id: organizationTemplates.id,
          templateId: organizationTemplates.templateId,
          assignedAt: organizationTemplates.assignedAt,
          templateName: taskTemplates.name,
          templateSlug: taskTemplates.slug,
          categoryId: taskTemplates.categoryId,
          businessAreaId: taskTemplates.businessAreaId,
        })
        .from(organizationTemplates)
        .leftJoin(taskTemplates, eq(organizationTemplates.templateId, taskTemplates.id))
        .where(eq(organizationTemplates.organizationId, organizationId));

      return activated;
    }),

  // Custom-Templates des Kunden
  getCustomerCustomTemplates: ownerOnlyProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { organizationId } = input;

      const customTemplates = await db
        .select({
          id: customSuperprompts.id,
          uniqueId: customSuperprompts.uniqueId,
          name: customSuperprompts.name,
          // displayTitle entfernt - existiert nicht im Schema
          status: customSuperprompts.status,
          usageCount: customSuperprompts.usageCount,
          lastUsedAt: customSuperprompts.lastUsedAt,
          createdAt: customSuperprompts.createdAt,
        })
        .from(customSuperprompts)
        .where(eq(customSuperprompts.organizationId, organizationId))
        .orderBy(desc(customSuperprompts.createdAt));

      return customTemplates;
    }),

  // ==================== PAKET-VERWALTUNG ====================

  // Alle verfügbaren Pläne
  getAvailablePlans: ownerOnlyProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, 1))
      .orderBy(subscriptionPlans.displayOrder);

    return plans;
  }),

  // Paket ändern
  updateCustomerPlan: ownerOnlyProcedure
    .input(z.object({
      organizationId: z.number(),
      planId: z.number(),
      validUntil: z.string().optional(), // ISO Date String
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { organizationId, planId, validUntil } = input;

      // Prüfe ob Plan existiert
      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, planId))
        .limit(1);

      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plan nicht gefunden" });
      }

      // Prüfe ob Subscription existiert
      const [existingSub] = await db
        .select()
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.organizationId, organizationId))
        .limit(1);

      const newValidUntil = validUntil 
        ? new Date(validUntil) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 Tage

      if (existingSub) {
        // Update
        await db
          .update(organizationSubscriptions)
          .set({
            planId,
            status: "active",
            validUntil: newValidUntil,
          })
          .where(eq(organizationSubscriptions.id, existingSub.id));
      } else {
        // Create
        await db.insert(organizationSubscriptions).values({
          organizationId,
          planId,
          status: "active",
          validUntil: newValidUntil,
          creditsUsed: 0,
          creditsTotal: plan.creditLimit || 100,
        });
      }

      return { success: true };
    }),

  // ==================== KATEGORIEN & BEREICHE (für Dropdowns) ====================

  // Alle Kategorien laden
  getCategories: ownerOnlyProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const cats = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        color: categories.color,
      })
      .from(categories)
      .where(eq(categories.isActive, 1))
      .orderBy(categories.displayOrder);

    return cats;
  }),

  // Alle Unternehmensbereiche laden
  getBusinessAreas: ownerOnlyProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const areas = await db
      .select({
        id: businessAreas.id,
        name: businessAreas.name,
        slug: businessAreas.slug,
        icon: businessAreas.icon,
      })
      .from(businessAreas)
      .where(eq(businessAreas.isActive, 1))
      .orderBy(businessAreas.displayOrder);

    return areas;
  }),
});
