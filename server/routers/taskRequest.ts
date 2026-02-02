import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { taskRequests, categories, businessAreas, users } from "../../drizzle/schema";
import { eq, desc, and, or, sql } from "drizzle-orm";

// Admin-Berechtigung prüfen
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Sie benötigen Admin-Rechte für diese Aktion",
    });
  }
  return next({ ctx });
});

export const taskRequestRouter = router({
  // Neue Anfrage erstellen (öffentlich - auch ohne Login)
  create: publicProcedure
    .input(z.object({
      description: z.string().min(10, "Bitte beschreiben Sie Ihre Aufgabe ausführlicher (mind. 10 Zeichen)"),
      categoryId: z.number().optional(),
      businessAreaId: z.number().optional(),
      deadline: z.string().optional(), // ISO Date String
      urgency: z.enum(["normal", "urgent", "asap"]).optional(),
      // Kontaktdaten (für nicht eingeloggte User)
      contactEmail: z.string().email().optional(),
      contactName: z.string().optional(),
      contactPhone: z.string().optional(),
      companyName: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Prüfe ob User eingeloggt ist
      const userId = ctx.user?.id || null;
      const organizationId = ctx.user?.organizationId || null;

      // Wenn nicht eingeloggt, brauchen wir mindestens eine E-Mail
      if (!userId && !input.contactEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bitte geben Sie Ihre E-Mail-Adresse an, damit wir Sie kontaktieren können",
        });
      }

      await db.insert(taskRequests).values({
        description: input.description,
        categoryId: input.categoryId || null,
        businessAreaId: input.businessAreaId || null,
        deadline: input.deadline ? new Date(input.deadline) : null,
        urgency: input.urgency || "normal",
        contactEmail: input.contactEmail || ctx.user?.email || null,
        contactName: input.contactName || ctx.user?.name || null,
        contactPhone: input.contactPhone || null,
        companyName: input.companyName || null,
        userId,
        organizationId,
        status: "new",
      });

      return {
        success: true,
        message: "Ihre Anfrage wurde erfolgreich übermittelt. Wir melden uns in Kürze mit einem Angebot bei Ihnen.",
      };
    }),

  // Alle Anfragen auflisten (Admin)
  list: adminProcedure
    .input(z.object({
      status: z.enum(["new", "reviewing", "offer_sent", "accepted", "rejected", "in_progress", "completed", "cancelled"]).optional(),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const conditions = [];
      if (input?.status) {
        conditions.push(eq(taskRequests.status, input.status));
      }

      const requests = await db
        .select({
          id: taskRequests.id,
          description: taskRequests.description,
          categoryId: taskRequests.categoryId,
          businessAreaId: taskRequests.businessAreaId,
          deadline: taskRequests.deadline,
          urgency: taskRequests.urgency,
          contactEmail: taskRequests.contactEmail,
          contactName: taskRequests.contactName,
          companyName: taskRequests.companyName,
          userId: taskRequests.userId,
          status: taskRequests.status,
          complexity: taskRequests.complexity,
          offerPrice: taskRequests.offerPrice,
          createdAt: taskRequests.createdAt,
          updatedAt: taskRequests.updatedAt,
          categoryName: categories.name,
          categoryIcon: categories.icon,
          businessAreaName: businessAreas.name,
        })
        .from(taskRequests)
        .leftJoin(categories, eq(taskRequests.categoryId, categories.id))
        .leftJoin(businessAreas, eq(taskRequests.businessAreaId, businessAreas.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(taskRequests.createdAt))
        .limit(input?.limit || 50)
        .offset(input?.offset || 0);

      // Zähle Gesamt
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(taskRequests)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        requests,
        total: countResult[0]?.count || 0,
      };
    }),

  // Einzelne Anfrage abrufen (Admin)
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const request = await db
        .select({
          id: taskRequests.id,
          description: taskRequests.description,
          categoryId: taskRequests.categoryId,
          businessAreaId: taskRequests.businessAreaId,
          deadline: taskRequests.deadline,
          urgency: taskRequests.urgency,
          contactEmail: taskRequests.contactEmail,
          contactName: taskRequests.contactName,
          contactPhone: taskRequests.contactPhone,
          companyName: taskRequests.companyName,
          userId: taskRequests.userId,
          organizationId: taskRequests.organizationId,
          status: taskRequests.status,
          offerText: taskRequests.offerText,
          offerPrice: taskRequests.offerPrice,
          offerCurrency: taskRequests.offerCurrency,
          offerValidUntil: taskRequests.offerValidUntil,
          offerSentAt: taskRequests.offerSentAt,
          resultTemplateId: taskRequests.resultTemplateId,
          resultExecutionId: taskRequests.resultExecutionId,
          complexity: taskRequests.complexity,
          estimatedEffort: taskRequests.estimatedEffort,
          internalNotes: taskRequests.internalNotes,
          assignedTo: taskRequests.assignedTo,
          createdAt: taskRequests.createdAt,
          updatedAt: taskRequests.updatedAt,
          respondedAt: taskRequests.respondedAt,
          completedAt: taskRequests.completedAt,
          categoryName: categories.name,
          categoryIcon: categories.icon,
          businessAreaName: businessAreas.name,
        })
        .from(taskRequests)
        .leftJoin(categories, eq(taskRequests.categoryId, categories.id))
        .leftJoin(businessAreas, eq(taskRequests.businessAreaId, businessAreas.id))
        .where(eq(taskRequests.id, input.id))
        .limit(1);

      if (!request.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Anfrage nicht gefunden" });
      }

      return request[0];
    }),

  // Status aktualisieren (Admin)
  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "reviewing", "offer_sent", "accepted", "rejected", "in_progress", "completed", "cancelled"]),
      internalNotes: z.string().optional(),
      complexity: z.enum(["standard", "complex", "custom"]).optional(),
      estimatedEffort: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const updateData: Record<string, any> = {
        status: input.status,
      };

      if (input.internalNotes !== undefined) {
        updateData.internalNotes = input.internalNotes;
      }
      if (input.complexity !== undefined) {
        updateData.complexity = input.complexity;
      }
      if (input.estimatedEffort !== undefined) {
        updateData.estimatedEffort = input.estimatedEffort;
      }
      if (input.status === "reviewing") {
        updateData.assignedTo = ctx.user.id;
      }
      if (input.status === "completed") {
        updateData.completedAt = new Date();
      }

      await db
        .update(taskRequests)
        .set(updateData)
        .where(eq(taskRequests.id, input.id));

      return { success: true };
    }),

  // Angebot senden (Admin)
  sendOffer: adminProcedure
    .input(z.object({
      id: z.number(),
      offerText: z.string().min(10),
      offerPrice: z.number().min(0).optional(),
      offerValidUntil: z.string().optional(), // ISO Date
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      await db
        .update(taskRequests)
        .set({
          offerText: input.offerText,
          offerPrice: input.offerPrice?.toString() || null,
          offerValidUntil: input.offerValidUntil ? new Date(input.offerValidUntil) : null,
          offerSentAt: new Date(),
          status: "offer_sent",
          respondedAt: new Date(),
        })
        .where(eq(taskRequests.id, input.id));

      // TODO: E-Mail an Kunden senden

      return { success: true, message: "Angebot wurde gesendet" };
    }),

  // Eigene Anfragen abrufen (eingeloggter User)
  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

    const requests = await db
      .select({
        id: taskRequests.id,
        description: taskRequests.description,
        deadline: taskRequests.deadline,
        urgency: taskRequests.urgency,
        status: taskRequests.status,
        offerText: taskRequests.offerText,
        offerPrice: taskRequests.offerPrice,
        offerValidUntil: taskRequests.offerValidUntil,
        createdAt: taskRequests.createdAt,
        categoryName: categories.name,
        businessAreaName: businessAreas.name,
      })
      .from(taskRequests)
      .leftJoin(categories, eq(taskRequests.categoryId, categories.id))
      .leftJoin(businessAreas, eq(taskRequests.businessAreaId, businessAreas.id))
      .where(eq(taskRequests.userId, ctx.user.id))
      .orderBy(desc(taskRequests.createdAt));

    return requests;
  }),

  // Statistiken für Dashboard (Admin)
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

    const stats = await db
      .select({
        status: taskRequests.status,
        count: sql<number>`count(*)`,
      })
      .from(taskRequests)
      .groupBy(taskRequests.status);

    const statusCounts: Record<string, number> = {};
    stats.forEach((s) => {
      if (s.status) {
        statusCounts[s.status] = s.count;
      }
    });

    return {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      new: statusCounts["new"] || 0,
      reviewing: statusCounts["reviewing"] || 0,
      offerSent: statusCounts["offer_sent"] || 0,
      accepted: statusCounts["accepted"] || 0,
      inProgress: statusCounts["in_progress"] || 0,
      completed: statusCounts["completed"] || 0,
      rejected: statusCounts["rejected"] || 0,
      cancelled: statusCounts["cancelled"] || 0,
    };
  }),
});
