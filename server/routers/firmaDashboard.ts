import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  users, 
  usageTracking, 
  workflowExecutions, 
  organizations,
  organizationMembers
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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

export const firmaDashboardRouter = router({
  // Prüfe ob User Firmen-Admin ist
  checkAccess: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // User muss einer Organisation angehören
    if (!ctx.user.organizationId) {
      return { hasAccess: false, reason: "Keine Organisation zugeordnet" };
    }

    // Prüfe ob User Admin oder Owner der Organisation ist
    const [membership] = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, ctx.user.organizationId),
        eq(organizationMembers.userId, ctx.user.id)
      ))
      .limit(1);

    if (!membership || (membership.role !== "admin" && membership.role !== "owner")) {
      return { hasAccess: false, reason: "Keine Admin-Berechtigung" };
    }

    return { hasAccess: true, role: membership.role };
  }),

  // KPI-Übersicht für Firmen-Admin
  getKpis: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    if (!ctx.user.organizationId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Keine Organisation zugeordnet" });
    }

    const orgId = ctx.user.organizationId;
    const currentMonth = getCurrentMonth();

    // Mitarbeiter zählen
    const memberCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, orgId));

    // Aktive Mitarbeiter (haben diesen Monat Tasks ausgeführt)
    const activeMembers = await db
      .select({ userId: usageTracking.userId })
      .from(usageTracking)
      .where(and(
        eq(usageTracking.organizationId, orgId),
        eq(usageTracking.periodMonth, currentMonth),
        sql`${usageTracking.tasksUsed} > 0`
      ));

    // Gesamt-Nutzung diesen Monat
    const monthlyUsage = await db
      .select({
        tasksUsed: sql<number>`SUM(${usageTracking.tasksUsed})`,
        inputTokens: sql<number>`SUM(${usageTracking.inputTokens})`,
        outputTokens: sql<number>`SUM(${usageTracking.outputTokens})`,
        totalCostEur: sql<number>`SUM(${usageTracking.totalCostEur})`,
      })
      .from(usageTracking)
      .where(and(
        eq(usageTracking.organizationId, orgId),
        eq(usageTracking.periodMonth, currentMonth)
      ));

    // Gesamt-Nutzung aller Zeiten
    const allTimeUsage = await db
      .select({
        tasksUsed: sql<number>`SUM(${usageTracking.tasksUsed})`,
        inputTokens: sql<number>`SUM(${usageTracking.inputTokens})`,
        outputTokens: sql<number>`SUM(${usageTracking.outputTokens})`,
        totalCostEur: sql<number>`SUM(${usageTracking.totalCostEur})`,
      })
      .from(usageTracking)
      .where(eq(usageTracking.organizationId, orgId));

    return {
      memberCount: memberCount[0]?.count || 0,
      activeMemberCount: new Set(activeMembers.map(m => m.userId)).size,
      currentMonth: {
        tasksUsed: monthlyUsage[0]?.tasksUsed || 0,
        inputTokens: monthlyUsage[0]?.inputTokens || 0,
        outputTokens: monthlyUsage[0]?.outputTokens || 0,
        totalCostEur: parseFloat(String(monthlyUsage[0]?.totalCostEur || 0)),
      },
      allTime: {
        tasksUsed: allTimeUsage[0]?.tasksUsed || 0,
        inputTokens: allTimeUsage[0]?.inputTokens || 0,
        outputTokens: allTimeUsage[0]?.outputTokens || 0,
        totalCostEur: parseFloat(String(allTimeUsage[0]?.totalCostEur || 0)),
      },
    };
  }),

  // Mitarbeiter-Nutzungsstatistiken
  getMemberStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    if (!ctx.user.organizationId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Keine Organisation zugeordnet" });
    }

    const orgId = ctx.user.organizationId;
    const currentMonth = getCurrentMonth();

    // Alle Mitglieder der Organisation laden
    const members = await db
      .select({
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        joinedAt: organizationMembers.joinedAt,
        userName: users.name,
        userEmail: users.email,
        lastSignedIn: users.lastSignedIn,
      })
      .from(organizationMembers)
      .leftJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, orgId));

    // Usage für jeden Mitarbeiter laden
    const memberStats = await Promise.all(
      members.map(async (member) => {
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
            eq(usageTracking.userId, member.userId),
            eq(usageTracking.periodMonth, currentMonth)
          ))
          .limit(1);

        // Letzte Ausführung
        const [lastExecution] = await db
          .select({ completedAt: workflowExecutions.completedAt })
          .from(workflowExecutions)
          .where(eq(workflowExecutions.userId, member.userId))
          .orderBy(desc(workflowExecutions.completedAt))
          .limit(1);

        return {
          userId: member.userId,
          name: member.userName || "Unbekannt",
          email: member.userEmail || "",
          role: member.role,
          joinedAt: member.joinedAt,
          lastSignedIn: member.lastSignedIn,
          lastExecution: lastExecution?.completedAt || null,
          currentMonth: {
            tasksUsed: currentUsage?.tasksUsed || 0,
            inputTokens: currentUsage?.inputTokens || 0,
            outputTokens: currentUsage?.outputTokens || 0,
            totalCostEur: parseFloat(String(currentUsage?.totalCostEur || 0)),
          },
        };
      })
    );

    return memberStats;
  }),

  // Trend-Daten (letzte 6 Monate)
  getTrends: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    if (!ctx.user.organizationId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Keine Organisation zugeordnet" });
    }

    const orgId = ctx.user.organizationId;
    const months = getLastNMonths(6);

    // Usage pro Monat aggregieren
    const trends = await Promise.all(
      months.map(async (month) => {
        const [usage] = await db
          .select({
            tasksUsed: sql<number>`SUM(${usageTracking.tasksUsed})`,
            totalCostEur: sql<number>`SUM(${usageTracking.totalCostEur})`,
          })
          .from(usageTracking)
          .where(and(
            eq(usageTracking.organizationId, orgId),
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

  // Top-Templates (meistgenutzt)
  getTopTemplates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    if (!ctx.user.organizationId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Keine Organisation zugeordnet" });
    }

    const orgId = ctx.user.organizationId;

    // Top 10 Templates nach Nutzung
    const topTemplates = await db
      .select({
        templateId: workflowExecutions.templateId,
        count: sql<number>`COUNT(*)`,
      })
      .from(workflowExecutions)
      .where(eq(workflowExecutions.organizationId, orgId))
      .groupBy(workflowExecutions.templateId)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    return topTemplates;
  }),

  // Export als CSV
  exportCsv: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    if (!ctx.user.organizationId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Keine Organisation zugeordnet" });
    }

    const orgId = ctx.user.organizationId;
    const currentMonth = getCurrentMonth();

    // Alle Mitarbeiter mit Usage
    const members = await db
      .select({
        userName: users.name,
        userEmail: users.email,
        tasksUsed: usageTracking.tasksUsed,
        inputTokens: usageTracking.inputTokens,
        outputTokens: usageTracking.outputTokens,
        totalCostEur: usageTracking.totalCostEur,
      })
      .from(usageTracking)
      .leftJoin(users, eq(usageTracking.userId, users.id))
      .where(and(
        eq(usageTracking.organizationId, orgId),
        eq(usageTracking.periodMonth, currentMonth)
      ));

    // CSV generieren
    const header = "Name,Email,Aufgaben,Input Tokens,Output Tokens,Kosten (EUR)";
    const rows = members.map(m => 
      `"${m.userName || ''}","${m.userEmail || ''}",${m.tasksUsed},${m.inputTokens || 0},${m.outputTokens || 0},${parseFloat(String(m.totalCostEur || 0)).toFixed(4)}`
    );

    return {
      csv: [header, ...rows].join("\n"),
      filename: `nutzungsstatistik-${currentMonth}.csv`,
    };
  }),
});
