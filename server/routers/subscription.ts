import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  subscriptionPlans, 
  organizationSubscriptions, 
  creditTransactions,
  organizations,
  organizationMembers
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Helper: Prüft ob User Owner ist
const isOwner = (userRole: string) => userRole === "owner";

// Helper: Berechnet Ablaufdatum basierend auf Trial-Tagen
const calculateTrialEndDate = (trialDays: number): Date => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + trialDays);
  return endDate;
};

export const subscriptionRouter = router({
  // Alle verfügbaren Pläne laden
  getPlans: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, 1))
      .orderBy(subscriptionPlans.displayOrder);

    return plans;
  }),

  // Aktuellen Subscription-Status der Organisation abrufen
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    // Wenn User keiner Organisation angehört
    if (!ctx.user.organizationId) {
      return {
        hasSubscription: false,
        status: null,
        plan: null,
        validUntil: null,
        daysRemaining: null,
        creditsUsed: null,
        creditsTotal: null,
        isExpired: false,
        isExpiringSoon: false,
      };
    }

    // Lade Subscription
    const subscription = await db
      .select({
        id: organizationSubscriptions.id,
        status: organizationSubscriptions.status,
        validUntil: organizationSubscriptions.validUntil,
        creditsUsed: organizationSubscriptions.creditsUsed,
        creditsTotal: organizationSubscriptions.creditsTotal,
        planId: organizationSubscriptions.planId,
      })
      .from(organizationSubscriptions)
      .where(eq(organizationSubscriptions.organizationId, ctx.user.organizationId))
      .orderBy(desc(organizationSubscriptions.createdAt))
      .limit(1);

    if (!subscription.length) {
      return {
        hasSubscription: false,
        status: null,
        plan: null,
        validUntil: null,
        daysRemaining: null,
        creditsUsed: null,
        creditsTotal: null,
        isExpired: false,
        isExpiringSoon: false,
      };
    }

    const sub = subscription[0];

    // Lade Plan-Details
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, sub.planId))
      .limit(1);

    // Berechne verbleibende Tage
    const now = new Date();
    const validUntil = new Date(sub.validUntil);
    const daysRemaining = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = daysRemaining <= 0;
    const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 14;

    return {
      hasSubscription: true,
      status: sub.status,
      plan: plan.length ? plan[0] : null,
      validUntil: sub.validUntil,
      daysRemaining: Math.max(0, daysRemaining),
      creditsUsed: sub.creditsUsed,
      creditsTotal: sub.creditsTotal,
      isExpired,
      isExpiringSoon,
    };
  }),

  // Prüfen ob User Zugriff auf Aufgaben hat
  checkAccess: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    // Owner hat immer Zugriff
    if (isOwner(ctx.user.role)) {
      return {
        hasAccess: true,
        reason: "owner",
        message: null,
      };
    }

    // Wenn User keiner Organisation angehört
    if (!ctx.user.organizationId) {
      return {
        hasAccess: false,
        reason: "no_organization",
        message: "Sie gehören keiner Organisation an. Bitte kontaktieren Sie Ihren Administrator.",
      };
    }

    // Lade aktive Subscription
    const subscription = await db
      .select()
      .from(organizationSubscriptions)
      .where(and(
        eq(organizationSubscriptions.organizationId, ctx.user.organizationId),
        sql`${organizationSubscriptions.status} IN ('trial', 'active')`
      ))
      .orderBy(desc(organizationSubscriptions.createdAt))
      .limit(1);

    if (!subscription.length) {
      return {
        hasAccess: false,
        reason: "no_subscription",
        message: "Ihre Organisation hat kein aktives Abonnement.",
      };
    }

    const sub = subscription[0];

    // Prüfe Ablaufdatum
    const now = new Date();
    const validUntil = new Date(sub.validUntil);
    if (now > validUntil) {
      return {
        hasAccess: false,
        reason: "expired",
        message: "Ihre Testphase ist abgelaufen. Bitte kontaktieren Sie uns für ein Upgrade.",
      };
    }

    // Prüfe Credits (falls begrenzt)
    if (sub.creditsTotal !== null && sub.creditsUsed !== null) {
      if (sub.creditsUsed >= sub.creditsTotal) {
        return {
          hasAccess: false,
          reason: "no_credits",
          message: "Sie haben alle Credits für diesen Monat verbraucht.",
        };
      }
    }

    return {
      hasAccess: true,
      reason: "active_subscription",
      message: null,
    };
  }),

  // Credit bei Ausführung abziehen
  useCredit: protectedProcedure
    .input(z.object({
      executionId: z.number(),
      amount: z.number().default(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Owner verbraucht keine Credits
      if (isOwner(ctx.user.role)) {
        return { success: true, creditsRemaining: null };
      }

      if (!ctx.user.organizationId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Organisation zugeordnet" });
      }

      // Lade aktive Subscription
      const subscription = await db
        .select()
        .from(organizationSubscriptions)
        .where(and(
          eq(organizationSubscriptions.organizationId, ctx.user.organizationId),
          sql`${organizationSubscriptions.status} IN ('trial', 'active')`
        ))
        .limit(1);

      if (!subscription.length) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Kein aktives Abonnement" });
      }

      const sub = subscription[0];

      // Update Credits
      const newCreditsUsed = (sub.creditsUsed || 0) + input.amount;
      await db
        .update(organizationSubscriptions)
        .set({ creditsUsed: newCreditsUsed })
        .where(eq(organizationSubscriptions.id, sub.id));

      // Transaktion loggen
      await db.insert(creditTransactions).values({
        organizationId: ctx.user.organizationId,
        userId: ctx.user.id,
        amount: -input.amount,
        balanceAfter: sub.creditsTotal ? sub.creditsTotal - newCreditsUsed : null,
        transactionType: "execution",
        executionId: input.executionId,
        description: `Aufgaben-Ausführung #${input.executionId}`,
      });

      return {
        success: true,
        creditsRemaining: sub.creditsTotal ? sub.creditsTotal - newCreditsUsed : null,
      };
    }),

  // Owner: Alle Subscriptions anzeigen
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (!isOwner(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können alle Subscriptions sehen" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    const subscriptions = await db
      .select({
        id: organizationSubscriptions.id,
        organizationId: organizationSubscriptions.organizationId,
        organizationName: organizations.name,
        status: organizationSubscriptions.status,
        validUntil: organizationSubscriptions.validUntil,
        creditsUsed: organizationSubscriptions.creditsUsed,
        creditsTotal: organizationSubscriptions.creditsTotal,
        planId: organizationSubscriptions.planId,
        planName: subscriptionPlans.name,
        startedAt: organizationSubscriptions.startedAt,
      })
      .from(organizationSubscriptions)
      .innerJoin(organizations, eq(organizationSubscriptions.organizationId, organizations.id))
      .innerJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
      .orderBy(desc(organizationSubscriptions.validUntil));

    return subscriptions;
  }),

  // Owner: Subscription verlängern
  extend: protectedProcedure
    .input(z.object({
      subscriptionId: z.number(),
      days: z.number().min(1).max(365),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isOwner(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können Subscriptions verlängern" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Lade Subscription
      const subscription = await db
        .select()
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.id, input.subscriptionId))
        .limit(1);

      if (!subscription.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subscription nicht gefunden" });
      }

      // Berechne neues Ablaufdatum
      const currentValidUntil = new Date(subscription[0].validUntil);
      const now = new Date();
      const baseDate = currentValidUntil > now ? currentValidUntil : now;
      baseDate.setDate(baseDate.getDate() + input.days);

      // Update
      await db
        .update(organizationSubscriptions)
        .set({ 
          validUntil: baseDate,
          status: "trial", // Reaktiviere falls abgelaufen
        })
        .where(eq(organizationSubscriptions.id, input.subscriptionId));

      return { success: true, newValidUntil: baseDate };
    }),

  // Owner: Plan erstellen/bearbeiten
  createPlan: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      userLimit: z.number().optional(),
      creditLimit: z.number().optional(),
      priceMonthly: z.string().optional(),
      priceYearly: z.string().optional(),
      isTrialPlan: z.boolean().default(false),
      trialDays: z.number().default(90),
      features: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isOwner(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können Pläne erstellen" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const result = await db.insert(subscriptionPlans).values({
        name: input.name,
        slug: input.slug,
        description: input.description,
        userLimit: input.userLimit,
        creditLimit: input.creditLimit,
        priceMonthly: input.priceMonthly,
        priceYearly: input.priceYearly,
        isTrialPlan: input.isTrialPlan ? 1 : 0,
        trialDays: input.trialDays,
        features: input.features,
      });

      return { success: true, id: Number((result as any).insertId) };
    }),
});
