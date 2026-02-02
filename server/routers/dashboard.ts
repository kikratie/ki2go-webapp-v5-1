import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  workflowExecutions, 
  taskTemplates, 
  documents,
  workflowProtocols
} from "../../drizzle/schema";
import { eq, and, desc, gte, sql, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const dashboardRouter = router({
  // Dashboard-Statistiken für den aktuellen User
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    const userId = ctx.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aufgaben heute
    const [todayExecutions] = await db
      .select({ count: count() })
      .from(workflowExecutions)
      .where(and(
        eq(workflowExecutions.userId, userId),
        gte(workflowExecutions.startedAt, today)
      ));

    // Gespeicherte Ergebnisse (alle abgeschlossenen Executions)
    const [savedResults] = await db
      .select({ count: count() })
      .from(workflowExecutions)
      .where(and(
        eq(workflowExecutions.userId, userId),
        eq(workflowExecutions.status, "completed")
      ));

    // Zeit gespart (Summe der estimatedTimeSavings aus den Templates)
    const timeSavedResult = await db
      .select({ 
        totalMinutes: sql<number>`COALESCE(SUM(${taskTemplates.estimatedTimeSavings}), 0)` 
      })
      .from(workflowExecutions)
      .leftJoin(taskTemplates, eq(workflowExecutions.templateId, taskTemplates.id))
      .where(and(
        eq(workflowExecutions.userId, userId),
        eq(workflowExecutions.status, "completed")
      ));

    const totalMinutes = timeSavedResult[0]?.totalMinutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const timeSavedFormatted = hours > 0 
      ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim()
      : `${minutes}m`;

    return {
      tasksToday: todayExecutions?.count || 0,
      savedResults: savedResults?.count || 0,
      timeSaved: timeSavedFormatted,
      timeSavedMinutes: totalMinutes,
    };
  }),

  // Letzte Aktivitäten des Users
  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const limit = input?.limit || 5;
      const userId = ctx.user.id;

      const activities = await db
        .select({
          id: workflowExecutions.id,
          status: workflowExecutions.status,
          createdAt: workflowExecutions.startedAt,
          completedAt: workflowExecutions.completedAt,
          templateId: workflowExecutions.templateId,
          templateTitle: taskTemplates.title,
          templateIcon: taskTemplates.icon,
          templateSlug: taskTemplates.slug,
          estimatedTimeSavings: taskTemplates.estimatedTimeSavings,
        })
        .from(workflowExecutions)
        .leftJoin(taskTemplates, eq(workflowExecutions.templateId, taskTemplates.id))
        .where(eq(workflowExecutions.userId, userId))
        .orderBy(desc(workflowExecutions.startedAt))
        .limit(limit);

      return activities.map(a => ({
        id: a.id,
        status: a.status,
        createdAt: a.createdAt,
        completedAt: a.completedAt,
        template: a.templateId ? {
          id: a.templateId,
          title: a.templateTitle || "Unbekannte Aufgabe",
          icon: a.templateIcon || "FileText",
          slug: a.templateSlug,
          estimatedTimeSavings: a.estimatedTimeSavings,
        } : null,
      }));
    }),

  // Quick Actions - Aktive Templates für Schnellstart
  getQuickActions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(12).default(6) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const limit = input?.limit || 6;

      // Hole die beliebtesten aktiven Templates (nach usageCount sortiert)
      const templates = await db
        .select({
          id: taskTemplates.id,
          slug: taskTemplates.slug,
          title: taskTemplates.title,
          shortDescription: taskTemplates.shortDescription,
          icon: taskTemplates.icon,
          color: taskTemplates.color,
          usageCount: taskTemplates.usageCount,
          isFeatured: taskTemplates.isFeatured,
        })
        .from(taskTemplates)
        .where(eq(taskTemplates.status, "active"))
        .orderBy(desc(taskTemplates.isFeatured), desc(taskTemplates.usageCount))
        .limit(limit);

      return templates;
    }),

  // Firmen-Statistiken für das Company Dashboard
  getCompanyStats: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const { organizationId } = input;
      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Mitglieder zählen
      const [memberCount] = await db
        .select({ count: count() })
        .from(sql`organization_members`)
        .where(sql`organization_id = ${organizationId}`);

      // Aufgaben diesen Monat (von allen Mitgliedern der Organisation)
      const [tasksThisMonth] = await db
        .select({ count: count() })
        .from(workflowExecutions)
        .innerJoin(sql`organization_members AS om`, sql`om.user_id = ${workflowExecutions.userId}`)
        .where(and(
          sql`om.organization_id = ${organizationId}`,
          gte(workflowExecutions.startedAt, firstOfMonth)
        ));

      // Aufgaben insgesamt
      const [tasksTotal] = await db
        .select({ count: count() })
        .from(workflowExecutions)
        .innerJoin(sql`organization_members AS om`, sql`om.user_id = ${workflowExecutions.userId}`)
        .where(sql`om.organization_id = ${organizationId}`);

      // Zeit gespart (basierend auf abgeschlossenen Aufgaben)
      const timeSavedResult = await db
        .select({ 
          totalMinutes: sql<number>`COALESCE(SUM(${taskTemplates.estimatedTimeSavings}), 0)` 
        })
        .from(workflowExecutions)
        .innerJoin(sql`organization_members AS om`, sql`om.user_id = ${workflowExecutions.userId}`)
        .leftJoin(taskTemplates, eq(workflowExecutions.templateId, taskTemplates.id))
        .where(and(
          sql`om.organization_id = ${organizationId}`,
          eq(workflowExecutions.status, "completed")
        ));

      const totalMinutes = timeSavedResult[0]?.totalMinutes || 0;
      const timeSavedHours = Math.round(totalMinutes / 60);

      return {
        memberCount: memberCount?.count || 1,
        tasksThisMonth: tasksThisMonth?.count || 0,
        tasksTotal: tasksTotal?.count || 0,
        timeSavedHours,
        timeSavedMinutes: totalMinutes,
      };
    }),

  // Letzte Aktivitäten der Firma
  getCompanyActivity: protectedProcedure
    .input(z.object({ 
      organizationId: z.number(),
      limit: z.number().min(1).max(20).default(5) 
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const { organizationId, limit } = input;

      // Hole alle Aktivitäten der Firmen-Mitglieder
      const activities = await db
        .select({
          id: workflowExecutions.id,
          status: workflowExecutions.status,
          createdAt: workflowExecutions.startedAt,
          completedAt: workflowExecutions.completedAt,
          userId: workflowExecutions.userId,
          templateId: workflowExecutions.templateId,
          templateName: taskTemplates.title,
          templateSlug: taskTemplates.slug,
          userName: sql<string>`u.name`,
          userEmail: sql<string>`u.email`,
        })
        .from(workflowExecutions)
        .innerJoin(sql`organization_members AS om`, sql`om.user_id = ${workflowExecutions.userId}`)
        .innerJoin(sql`users AS u`, sql`u.id = ${workflowExecutions.userId}`)
        .leftJoin(taskTemplates, eq(workflowExecutions.templateId, taskTemplates.id))
        .where(sql`om.organization_id = ${organizationId}`)
        .orderBy(desc(workflowExecutions.startedAt))
        .limit(limit);

      return activities;
    }),
});
