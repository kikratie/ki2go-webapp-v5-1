import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  users,
  organizations,
  organizationMembers,
  organizationSubscriptions,
  subscriptionPlans,
  usageTracking,
  workflowExecutions,
  taskTemplates,
} from "../../drizzle/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";

export const userSubscriptionRouter = router({
  // Aktuelles Abo des Users laden
  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
    const userId = ctx.user.id;

    // Finde die Organisation des Users
    const membership = await db
      .select({
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId))
      .limit(1);

    if (!membership.length) {
      return null;
    }

    const orgId = membership[0].organizationId;

    // Lade Organisation mit Subscription und Plan
    const result = await db
      .select({
        organization: {
          id: organizations.id,
          name: organizations.name,
          customerNumber: organizations.customerNumber,
        },
        subscription: {
          id: organizationSubscriptions.id,
          status: organizationSubscriptions.status,
          startedAt: organizationSubscriptions.startedAt,
          validUntil: organizationSubscriptions.validUntil,
          creditsUsed: organizationSubscriptions.creditsUsed,
          creditsTotal: organizationSubscriptions.creditsTotal,
        },
        plan: {
          id: subscriptionPlans.id,
          name: subscriptionPlans.name,
          slug: subscriptionPlans.slug,
          description: subscriptionPlans.description,
          userLimit: subscriptionPlans.userLimit,
          creditLimit: subscriptionPlans.creditLimit,
          priceMonthly: subscriptionPlans.priceMonthly,
          priceYearly: subscriptionPlans.priceYearly,
          currency: subscriptionPlans.currency,
          isTrialPlan: subscriptionPlans.isTrialPlan,
          trialDays: subscriptionPlans.trialDays,
          features: subscriptionPlans.features,
        },
        memberRole: organizationMembers.role,
      })
      .from(organizations)
      .leftJoin(
        organizationSubscriptions,
        eq(organizations.id, organizationSubscriptions.organizationId)
      )
      .leftJoin(
        subscriptionPlans,
        eq(organizationSubscriptions.planId, subscriptionPlans.id)
      )
      .leftJoin(
        organizationMembers,
        and(
          eq(organizations.id, organizationMembers.organizationId),
          eq(organizationMembers.userId, userId)
        )
      )
      .where(eq(organizations.id, orgId))
      .limit(1);

    if (!result.length || !result[0].subscription) {
      return {
        organization: result[0]?.organization || null,
        subscription: null,
        plan: null,
        memberRole: membership[0].role,
      };
    }

    // Berechne verbleibende Tage
    const validUntil = result[0].subscription.validUntil;
    const now = new Date();
    const daysRemaining = validUntil
      ? Math.max(0, Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    // Zähle aktive Mitarbeiter
    const memberCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, orgId));

    return {
      organization: result[0].organization,
      subscription: {
        ...result[0].subscription,
        daysRemaining,
      },
      plan: result[0].plan,
      memberRole: result[0].memberRole,
      memberCount: memberCount[0]?.count || 0,
    };
  }),

  // Nutzungsstatistiken des Users
  getMyUsage: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });
    const userId = ctx.user.id;

    // Zeitraum: Letzten 30 Tage
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aufgaben in den letzten 30 Tagen
    const tasksThisMonth = await db
      .select({ count: sql<number>`count(*)` })
      .from(workflowExecutions)
      .where(
        and(
          eq(workflowExecutions.userId, userId),
          gte(workflowExecutions.startedAt, thirtyDaysAgo)
        )
      );

    // Gesamt-Aufgaben
    const totalTasks = await db
      .select({ count: sql<number>`count(*)` })
      .from(workflowExecutions)
      .where(eq(workflowExecutions.userId, userId));

    // Letzte 5 Aufgaben mit Template-Namen
    const recentTasks = await db
      .select({
        id: workflowExecutions.id,
        templateId: workflowExecutions.templateId,
        templateName: taskTemplates.title,
        startedAt: workflowExecutions.startedAt,
        status: workflowExecutions.status,
      })
      .from(workflowExecutions)
      .leftJoin(taskTemplates, eq(workflowExecutions.templateId, taskTemplates.id))
      .where(eq(workflowExecutions.userId, userId))
      .orderBy(desc(workflowExecutions.startedAt))
      .limit(5);

    // Nutzung nach Template (Top 5)
    const usageByTemplate = await db
      .select({
        templateName: taskTemplates.title,
        count: sql<number>`count(*)`,
      })
      .from(workflowExecutions)
      .leftJoin(taskTemplates, eq(workflowExecutions.templateId, taskTemplates.id))
      .where(eq(workflowExecutions.userId, userId))
      .groupBy(taskTemplates.title)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    return {
      tasksThisMonth: tasksThisMonth[0]?.count || 0,
      totalTasks: totalTasks[0]?.count || 0,
      recentTasks,
      usageByTemplate,
    };
  }),

  // Verfügbare Pakete für Upgrade
  getAvailablePlans: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

    // Lade alle aktiven Pakete
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, 1))
      .orderBy(subscriptionPlans.displayOrder);

    return plans;
  }),
});
