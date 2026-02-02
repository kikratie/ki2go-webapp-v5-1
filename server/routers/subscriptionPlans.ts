import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { subscriptionPlans, organizationSubscriptions } from "../../drizzle/schema";
import { eq, asc, sql } from "drizzle-orm";

// Helper: Nur Owner darf zugreifen
const ownerOnlyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nur für Owner zugänglich" });
  }
  return next({ ctx });
});

export const subscriptionPlansRouter = router({
  // Alle Pakete laden (öffentlich für Preisseite)
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

    const plans = await db
      .select()
      .from(subscriptionPlans)
      .orderBy(asc(subscriptionPlans.displayOrder));
    return plans;
  }),

  // Nur aktive Pakete laden (für User-Auswahl)
  getActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, 1))
      .orderBy(asc(subscriptionPlans.displayOrder));
    return plans;
  }),

  // Einzelnes Paket laden
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, input.id));
      
      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Paket nicht gefunden",
        });
      }
      
      return plan;
    }),

  // Neues Paket erstellen (nur Owner)
  create: ownerOnlyProcedure
    .input(z.object({
      name: z.string().min(1, "Name ist erforderlich"),
      slug: z.string().min(1, "Slug ist erforderlich"),
      description: z.string().optional(),
      userLimit: z.number().nullable().optional(),
      creditLimit: z.number().nullable().optional(),
      priceMonthly: z.string().optional().default("0.00"),
      priceYearly: z.string().optional().default("0.00"),
      currency: z.string().optional().default("EUR"),
      isTrialPlan: z.boolean().optional().default(false),
      trialDays: z.number().optional().default(90),
      features: z.array(z.string()).optional().default([]),
      isActive: z.boolean().optional().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Prüfen ob Slug bereits existiert
      const [existing] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.slug, input.slug));
      
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ein Paket mit diesem Slug existiert bereits",
        });
      }

      // Höchste displayOrder ermitteln
      const [maxOrder] = await db
        .select({ max: sql<number>`MAX(displayOrder)` })
        .from(subscriptionPlans);
      
      const nextOrder = (maxOrder?.max ?? 0) + 1;

      const [result] = await db.insert(subscriptionPlans).values({
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        userLimit: input.userLimit ?? 1,
        creditLimit: input.creditLimit ?? null,
        priceMonthly: input.priceMonthly,
        priceYearly: input.priceYearly,
        currency: input.currency,
        isTrialPlan: input.isTrialPlan ? 1 : 0,
        trialDays: input.trialDays,
        features: input.features,
        isActive: input.isActive ? 1 : 0,
        displayOrder: nextOrder,
      });

      return { id: result.insertId, success: true };
    }),

  // Paket aktualisieren (nur Owner)
  update: ownerOnlyProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().nullable().optional(),
      userLimit: z.number().nullable().optional(),
      creditLimit: z.number().nullable().optional(),
      priceMonthly: z.string().optional(),
      priceYearly: z.string().optional(),
      currency: z.string().optional(),
      isTrialPlan: z.boolean().optional(),
      trialDays: z.number().optional(),
      features: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const { id, ...updateData } = input;

      // Prüfen ob Paket existiert
      const [existing] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, id));
      
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Paket nicht gefunden",
        });
      }

      // Wenn Slug geändert wird, prüfen ob er bereits existiert
      if (updateData.slug && updateData.slug !== existing.slug) {
        const [slugExists] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.slug, updateData.slug));
        
        if (slugExists) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ein Paket mit diesem Slug existiert bereits",
          });
        }
      }

      // Update-Objekt vorbereiten
      const updates: Record<string, any> = {};
      if (updateData.name !== undefined) updates.name = updateData.name;
      if (updateData.slug !== undefined) updates.slug = updateData.slug;
      if (updateData.description !== undefined) updates.description = updateData.description;
      if (updateData.userLimit !== undefined) updates.userLimit = updateData.userLimit;
      if (updateData.creditLimit !== undefined) updates.creditLimit = updateData.creditLimit;
      if (updateData.priceMonthly !== undefined) updates.priceMonthly = updateData.priceMonthly;
      if (updateData.priceYearly !== undefined) updates.priceYearly = updateData.priceYearly;
      if (updateData.currency !== undefined) updates.currency = updateData.currency;
      if (updateData.isTrialPlan !== undefined) updates.isTrialPlan = updateData.isTrialPlan ? 1 : 0;
      if (updateData.trialDays !== undefined) updates.trialDays = updateData.trialDays;
      if (updateData.features !== undefined) updates.features = updateData.features;
      if (updateData.isActive !== undefined) updates.isActive = updateData.isActive ? 1 : 0;

      await db
        .update(subscriptionPlans)
        .set(updates)
        .where(eq(subscriptionPlans.id, id));

      return { success: true };
    }),

  // Paket löschen (nur Owner)
  delete: ownerOnlyProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Prüfen ob Paket von Organisationen verwendet wird
      const [usageCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(organizationSubscriptions)
        .where(eq(organizationSubscriptions.planId, input.id));
      
      if (usageCount && usageCount.count > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Dieses Paket wird von ${usageCount.count} Organisation(en) verwendet und kann nicht gelöscht werden. Deaktivieren Sie es stattdessen.`,
        });
      }

      await db
        .delete(subscriptionPlans)
        .where(eq(subscriptionPlans.id, input.id));

      return { success: true };
    }),

  // Reihenfolge ändern (nur Owner)
  reorder: ownerOnlyProcedure
    .input(z.object({
      orderedIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Alle IDs mit neuer Reihenfolge aktualisieren
      for (let i = 0; i < input.orderedIds.length; i++) {
        await db
          .update(subscriptionPlans)
          .set({ displayOrder: i })
          .where(eq(subscriptionPlans.id, input.orderedIds[i]));
      }

      return { success: true };
    }),

  // Paket aktivieren/deaktivieren (nur Owner)
  toggleStatus: ownerOnlyProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const [plan] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, input.id));
      
      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Paket nicht gefunden",
        });
      }

      await db
        .update(subscriptionPlans)
        .set({ isActive: plan.isActive ? 0 : 1 })
        .where(eq(subscriptionPlans.id, input.id));

      return { success: true, isActive: !plan.isActive };
    }),

  // Statistiken zu Paket-Nutzung (nur Owner)
  getStats: ownerOnlyProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

    // Anzahl Subscriptions pro Paket
    const stats = await db
      .select({
        planId: subscriptionPlans.id,
        planName: subscriptionPlans.name,
        totalSubscriptions: sql<number>`COUNT(${organizationSubscriptions.id})`,
        activeSubscriptions: sql<number>`SUM(CASE WHEN ${organizationSubscriptions.status} IN ('trial', 'active') THEN 1 ELSE 0 END)`,
      })
      .from(subscriptionPlans)
      .leftJoin(organizationSubscriptions, eq(subscriptionPlans.id, organizationSubscriptions.planId))
      .groupBy(subscriptionPlans.id, subscriptionPlans.name)
      .orderBy(asc(subscriptionPlans.displayOrder));

    return stats;
  }),
});
