import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  users, 
  usageTracking, 
  organizations,
  workflowExecutions
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getTotalManusCoststSummary, getAllCustomersCostSummary } from "../planFeatures";

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

// Owner-Only Procedure
const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "owner" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nur für Owner/Admin" });
  }
  return next({ ctx });
});

export const ownerDashboardRouter = router({
  // Gesamt-Manus-Kosten (was kostet der Owner bei Manus)
  getManusKosten: ownerProcedure.query(async () => {
    return await getTotalManusCoststSummary();
  }),

  // Kosten pro Kunde/Organisation
  getKundenKosten: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const currentMonth = getCurrentMonth();

    // Alle Organisationen mit Nutzung laden
    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
      })
      .from(organizations);

    // Usage pro Organisation aggregieren
    const orgStats = await Promise.all(
      orgs.map(async (org) => {
        // Aktueller Monat
        const [currentUsage] = await db
          .select({
            tasksUsed: sql<number>`SUM(${usageTracking.tasksUsed})`,
            inputTokens: sql<number>`SUM(${usageTracking.inputTokens})`,
            outputTokens: sql<number>`SUM(${usageTracking.outputTokens})`,
            totalCostEur: sql<number>`SUM(${usageTracking.totalCostEur})`,
          })
          .from(usageTracking)
          .where(and(
            eq(usageTracking.organizationId, org.id),
            eq(usageTracking.periodMonth, currentMonth)
          ));

        // Alle Zeit
        const [allTimeUsage] = await db
          .select({
            tasksUsed: sql<number>`SUM(${usageTracking.tasksUsed})`,
            inputTokens: sql<number>`SUM(${usageTracking.inputTokens})`,
            outputTokens: sql<number>`SUM(${usageTracking.outputTokens})`,
            totalCostEur: sql<number>`SUM(${usageTracking.totalCostEur})`,
          })
          .from(usageTracking)
          .where(eq(usageTracking.organizationId, org.id));

        // Mitarbeiter zählen
        const [memberCount] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${usageTracking.userId})` })
          .from(usageTracking)
          .where(eq(usageTracking.organizationId, org.id));

        return {
          organizationId: org.id,
          organizationName: org.name,
          memberCount: memberCount?.count || 0,
          currentMonth: {
            tasksUsed: currentUsage?.tasksUsed || 0,
            inputTokens: currentUsage?.inputTokens || 0,
            outputTokens: currentUsage?.outputTokens || 0,
            totalCostEur: parseFloat(String(currentUsage?.totalCostEur || 0)),
          },
          allTime: {
            tasksUsed: allTimeUsage?.tasksUsed || 0,
            inputTokens: allTimeUsage?.inputTokens || 0,
            outputTokens: allTimeUsage?.outputTokens || 0,
            totalCostEur: parseFloat(String(allTimeUsage?.totalCostEur || 0)),
          },
        };
      })
    );

    // Sortiere nach Kosten (höchste zuerst)
    return orgStats.sort((a, b) => b.allTime.totalCostEur - a.allTime.totalCostEur);
  }),

  // Kosten-Trend über Zeit (letzte 12 Monate)
  getKostenTrend: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const months = getLastNMonths(12);

    // Usage pro Monat aggregieren
    const trends = await Promise.all(
      months.map(async (month) => {
        const [usage] = await db
          .select({
            tasksUsed: sql<number>`SUM(${usageTracking.tasksUsed})`,
            inputTokens: sql<number>`SUM(${usageTracking.inputTokens})`,
            outputTokens: sql<number>`SUM(${usageTracking.outputTokens})`,
            totalCostEur: sql<number>`SUM(${usageTracking.totalCostEur})`,
          })
          .from(usageTracking)
          .where(eq(usageTracking.periodMonth, month));

        return {
          month,
          tasksUsed: usage?.tasksUsed || 0,
          inputTokens: usage?.inputTokens || 0,
          outputTokens: usage?.outputTokens || 0,
          totalCostEur: parseFloat(String(usage?.totalCostEur || 0)),
        };
      })
    );

    return trends.reverse(); // Älteste zuerst
  }),

  // Einzelne User-Nutzung (für detaillierte Analyse)
  getUserNutzung: ownerProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // User-Info laden
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          companyName: users.companyName,
          organizationId: users.organizationId,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User nicht gefunden" });
      }

      // Alle Usage-Einträge laden
      const usage = await db
        .select()
        .from(usageTracking)
        .where(eq(usageTracking.userId, input.userId))
        .orderBy(desc(usageTracking.periodMonth));

      // Letzte Ausführungen laden
      const executions = await db
        .select({
          id: workflowExecutions.id,
          templateId: workflowExecutions.templateId,
          status: workflowExecutions.status,
          promptTokens: workflowExecutions.promptTokens,
          completionTokens: workflowExecutions.completionTokens,
          estimatedCost: workflowExecutions.estimatedCost,
          completedAt: workflowExecutions.completedAt,
        })
        .from(workflowExecutions)
        .where(eq(workflowExecutions.userId, input.userId))
        .orderBy(desc(workflowExecutions.completedAt))
        .limit(50);

      return {
        user,
        usage,
        recentExecutions: executions,
      };
    }),

  // Alle User mit Nutzung (für Owner-Übersicht)
  getAllUsersNutzung: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const currentMonth = getCurrentMonth();

    // Alle User mit Nutzung laden
    const allUsers = await db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        companyName: users.companyName,
        organizationId: users.organizationId,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .where(eq(users.status, "active"));

    // Usage für jeden User laden
    const userStats = await Promise.all(
      allUsers.map(async (user) => {
        // Aktueller Monat
        const [currentUsage] = await db
          .select({
            tasksUsed: usageTracking.tasksUsed,
            inputTokens: usageTracking.inputTokens,
            outputTokens: usageTracking.outputTokens,
            totalCostEur: usageTracking.totalCostEur,
          })
          .from(usageTracking)
          .where(and(
            eq(usageTracking.userId, user.userId),
            eq(usageTracking.periodMonth, currentMonth)
          ))
          .limit(1);

        // Alle Zeit
        const allTimeUsage = await db
          .select({
            tasksUsed: usageTracking.tasksUsed,
            inputTokens: usageTracking.inputTokens,
            outputTokens: usageTracking.outputTokens,
            totalCostEur: usageTracking.totalCostEur,
          })
          .from(usageTracking)
          .where(eq(usageTracking.userId, user.userId));

        const allTimeSum = allTimeUsage.reduce(
          (acc, u) => ({
            tasksUsed: acc.tasksUsed + (u.tasksUsed || 0),
            inputTokens: acc.inputTokens + (u.inputTokens || 0),
            outputTokens: acc.outputTokens + (u.outputTokens || 0),
            totalCostEur: acc.totalCostEur + parseFloat(String(u.totalCostEur || 0)),
          }),
          { tasksUsed: 0, inputTokens: 0, outputTokens: 0, totalCostEur: 0 }
        );

        return {
          userId: user.userId,
          name: user.userName || "Unbekannt",
          email: user.userEmail || "",
          companyName: user.companyName || "",
          organizationId: user.organizationId,
          lastSignedIn: user.lastSignedIn,
          currentMonth: {
            tasksUsed: currentUsage?.tasksUsed || 0,
            inputTokens: currentUsage?.inputTokens || 0,
            outputTokens: currentUsage?.outputTokens || 0,
            totalCostEur: parseFloat(String(currentUsage?.totalCostEur || 0)),
          },
          allTime: allTimeSum,
        };
      })
    );

    // Sortiere nach Kosten (höchste zuerst)
    return userStats.sort((a, b) => b.allTime.totalCostEur - a.allTime.totalCostEur);
  }),
});
