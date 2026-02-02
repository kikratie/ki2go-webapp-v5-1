import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { taskTemplates, superpromptVersions, categories, businessAreas, adminLogs } from "../../drizzle/schema";
import { eq, desc, asc, and, or, like, sql } from "drizzle-orm";

// Variable Schema Validierung
const variableSchemaItem = z.object({
  key: z.string().min(1).regex(/^[A-Za-z][A-Za-z0-9_]*$/, "Key muss mit Buchstabe beginnen und nur A-Z, a-z, 0-9, _ enthalten"),
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "number", "select", "file", "multiselect", "date"]),
  required: z.boolean(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  helpText: z.string().optional(),
  fileTypes: z.array(z.string()).optional(),
  maxFileSize: z.number().optional(),
  defaultValue: z.string().optional(),
  displayOrder: z.number().optional(),
});

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

// Admin-Log erstellen
async function logAdminAction(
  userId: number,
  action: string,
  targetType: string,
  targetId: number | null,
  changes?: object
) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(adminLogs).values({
      userId,
      action,
      targetType,
      targetId,
      changes: changes ? JSON.stringify(changes) : null,
    });
  } catch (error) {
    console.error("[AdminLog] Failed to log action:", error);
  }
}

export const templateRouter = router({
  // Alle Templates auflisten (für Admin)
  list: adminProcedure
    .input(z.object({
      includeArchived: z.boolean().optional().default(false),
      categoryId: z.number().optional(),
      businessAreaId: z.number().optional(),
      status: z.enum(["draft", "active", "archived"]).optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const conditions = [];
      
      if (!input?.includeArchived) {
        conditions.push(sql`${taskTemplates.status} != 'archived'`);
      }
      
      if (input?.categoryId) {
        conditions.push(eq(taskTemplates.categoryId, input.categoryId));
      }
      
      if (input?.businessAreaId) {
        conditions.push(eq(taskTemplates.businessAreaId, input.businessAreaId));
      }
      
      if (input?.status) {
        conditions.push(eq(taskTemplates.status, input.status));
      }
      
      if (input?.search) {
        conditions.push(
          or(
            like(taskTemplates.name, `%${input.search}%`),
            like(taskTemplates.title, `%${input.search}%`),
            like(taskTemplates.description, `%${input.search}%`)
          )
        );
      }

      const templates = await db
        .select({
          id: taskTemplates.id,
          slug: taskTemplates.slug,
          name: taskTemplates.name,
          title: taskTemplates.title,
          description: taskTemplates.description,
          shortDescription: taskTemplates.shortDescription,
          categoryId: taskTemplates.categoryId,
          businessAreaId: taskTemplates.businessAreaId,
          icon: taskTemplates.icon,
          color: taskTemplates.color,
          status: taskTemplates.status,
          displayOrder: taskTemplates.displayOrder,
          isFeatured: taskTemplates.isFeatured,
          isPublic: taskTemplates.isPublic,
          usageCount: taskTemplates.usageCount,
          avgRating: taskTemplates.avgRating,
          // Wichtige Inhaltsfelder
          superprompt: taskTemplates.superprompt,
          variableSchema: taskTemplates.variableSchema,
          estimatedTimeSavings: taskTemplates.estimatedTimeSavings,
          creditCost: taskTemplates.creditCost,
          // Dokument-Einstellungen
          documentRequired: taskTemplates.documentRequired,
          documentCount: taskTemplates.documentCount,
          maxPages: taskTemplates.maxPages,
          documentRelevanceCheck: taskTemplates.documentRelevanceCheck,
          documentDescription: taskTemplates.documentDescription,
          // Masking-Einstellungen
          maskingRequired: taskTemplates.maskingRequired,
          autoMasking: taskTemplates.autoMasking,
          // Keywords
          keywords: taskTemplates.keywords,
          // Audit-Felder
          uniqueId: taskTemplates.uniqueId,
          creationMethod: taskTemplates.creationMethod,
          sourceMetapromptId: taskTemplates.sourceMetapromptId,
          createdBy: taskTemplates.createdBy,
          createdAt: taskTemplates.createdAt,
          updatedAt: taskTemplates.updatedAt,
          // Autor-Tracking
          createdByName: taskTemplates.createdByName,
          lastModifiedByName: taskTemplates.lastModifiedByName,
          templateVersion: taskTemplates.templateVersion,
          changeLog: taskTemplates.changeLog,
          // ROI-Kalkulation
          roiBaseTimeMinutes: taskTemplates.roiBaseTimeMinutes,
          roiTimePerDocumentMinutes: taskTemplates.roiTimePerDocumentMinutes,
          roiKi2goTimeMinutes: taskTemplates.roiKi2goTimeMinutes,
          roiKi2goTimePerDocument: taskTemplates.roiKi2goTimePerDocument,
          roiHourlyRate: taskTemplates.roiHourlyRate,
          roiTasksPerMonth: taskTemplates.roiTasksPerMonth,
          roiSources: taskTemplates.roiSources,
          // Disclaimer
          disclaimer: taskTemplates.disclaimer,
          // Marketing-Felder
          marketingEnabled: taskTemplates.marketingEnabled,
          marketingHeadline: taskTemplates.marketingHeadline,
          marketingSubheadline: taskTemplates.marketingSubheadline,
          marketingUsps: taskTemplates.marketingUsps,
          marketingCtaText: taskTemplates.marketingCtaText,
          marketingMetaDescription: taskTemplates.marketingMetaDescription,
          marketingKeywords: taskTemplates.marketingKeywords,
          categoryName: categories.name,
          categoryIcon: categories.icon,
          businessAreaName: businessAreas.name,
          businessAreaIcon: businessAreas.icon,
        })
        .from(taskTemplates)
        .leftJoin(categories, eq(taskTemplates.categoryId, categories.id))
        .leftJoin(businessAreas, eq(taskTemplates.businessAreaId, businessAreas.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(taskTemplates.displayOrder), desc(taskTemplates.createdAt));

      return templates;
    }),

  // Aktive Templates für Benutzer (öffentlich)
  listActive: publicProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      businessAreaId: z.number().optional(),
      featured: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const conditions = [eq(taskTemplates.status, "active")];
      
      if (input?.categoryId) {
        conditions.push(eq(taskTemplates.categoryId, input.categoryId));
      }
      
      if (input?.businessAreaId) {
        conditions.push(eq(taskTemplates.businessAreaId, input.businessAreaId));
      }
      
      if (input?.featured) {
        conditions.push(eq(taskTemplates.isFeatured, 1));
      }

      const templates = await db
        .select({
          id: taskTemplates.id,
          slug: taskTemplates.slug,
          title: taskTemplates.title,
          shortDescription: taskTemplates.shortDescription,
          icon: taskTemplates.icon,
          color: taskTemplates.color,
          categoryId: taskTemplates.categoryId,
          businessAreaId: taskTemplates.businessAreaId,
          estimatedTimeSavings: taskTemplates.estimatedTimeSavings,
          usageCount: taskTemplates.usageCount,
          avgRating: taskTemplates.avgRating,
          categoryName: categories.name,
          categoryIcon: categories.icon,
          businessAreaName: businessAreas.name,
        })
        .from(taskTemplates)
        .leftJoin(categories, eq(taskTemplates.categoryId, categories.id))
        .leftJoin(businessAreas, eq(taskTemplates.businessAreaId, businessAreas.id))
        .where(and(...conditions))
        .orderBy(asc(taskTemplates.displayOrder));

      return templates;
    }),

  // Template nach ID laden (Admin - vollständig)
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const [template] = await db
        .select()
        .from(taskTemplates)
        .where(eq(taskTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template nicht gefunden" });
      }

      return template;
    }),

  // Template nach Slug laden (öffentlich - für Benutzer)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const [template] = await db
        .select({
          id: taskTemplates.id,
          slug: taskTemplates.slug,
          title: taskTemplates.title,
          description: taskTemplates.description,
          shortDescription: taskTemplates.shortDescription,
          icon: taskTemplates.icon,
          color: taskTemplates.color,
          variableSchema: taskTemplates.variableSchema,
          estimatedTimeSavings: taskTemplates.estimatedTimeSavings,
          categoryId: taskTemplates.categoryId,
          businessAreaId: taskTemplates.businessAreaId,
          categoryName: categories.name,
          businessAreaName: businessAreas.name,
          // Dokument-Einstellungen
          documentRequired: taskTemplates.documentRequired,
          documentCount: taskTemplates.documentCount,
          documentDescription: taskTemplates.documentDescription,
          // ROI-Kalkulation
          roiBaseTimeMinutes: taskTemplates.roiBaseTimeMinutes,
          roiTimePerDocumentMinutes: taskTemplates.roiTimePerDocumentMinutes,
          roiKi2goTimeMinutes: taskTemplates.roiKi2goTimeMinutes,
          roiKi2goTimePerDocument: taskTemplates.roiKi2goTimePerDocument,
          roiHourlyRate: taskTemplates.roiHourlyRate,
          roiTasksPerMonth: taskTemplates.roiTasksPerMonth,
          roiSources: taskTemplates.roiSources,
        })
        .from(taskTemplates)
        .leftJoin(categories, eq(taskTemplates.categoryId, categories.id))
        .leftJoin(businessAreas, eq(taskTemplates.businessAreaId, businessAreas.id))
        .where(and(
          eq(taskTemplates.slug, input.slug),
          eq(taskTemplates.status, "active")
        ))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template nicht gefunden" });
      }

      return template;
    }),

  // Neues Template erstellen
  create: adminProcedure
    .input(z.object({
      slug: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, "Slug muss mit Buchstabe beginnen und darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten"),
      name: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      shortDescription: z.string().optional(),
      categoryId: z.number().optional(),
      businessAreaId: z.number().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      variableSchema: z.array(variableSchemaItem).optional(),
      superprompt: z.string().optional(),
      estimatedTimeSavings: z.number().optional(),
      creditCost: z.number().optional(),
      llmModel: z.string().optional(),
      llmTemperature: z.string().optional(),
      maxTokens: z.number().optional(),
      outputFormat: z.enum(["markdown", "json", "text", "html"]).optional(),
      exampleOutput: z.string().optional(),
      // Dokument-Anforderungen
      documentRequired: z.number().optional(),
      documentCount: z.number().optional(),
      allowedFileTypes: z.array(z.string()).optional(),
      maxFileSize: z.number().optional(),
      maxPages: z.number().optional(),
      documentRelevanceCheck: z.number().optional(),
      documentDescription: z.string().optional(),
      // Masking-Einstellungen
      maskingRequired: z.number().optional(),
      maskingTypes: z.array(z.string()).optional(),
      autoMasking: z.number().optional(),
      // Keywords für Matching
      keywords: z.array(z.string()).optional(),
      status: z.enum(["draft", "active", "archived"]).optional(),
      isFeatured: z.number().optional(),
      isPublic: z.number().optional().default(0), // Öffentlich zugänglich für alle User
      // Autor-Tracking (optional - wird automatisch aus ctx.user.name gesetzt wenn leer)
      createdByName: z.string().optional(),
      templateVersion: z.string().optional().default("1.0"),
      changeLog: z.string().optional(),
      // ROI-Kalkulation
      roiBaseTimeMinutes: z.number().optional().default(30),
      roiTimePerDocumentMinutes: z.number().optional().default(15),
      roiKi2goTimeMinutes: z.number().optional().default(3),
      roiHourlyRate: z.number().optional().default(80),
      roiTasksPerMonth: z.number().optional().default(10),
      roiSources: z.array(z.object({
        name: z.string(),
        url: z.string(),
        finding: z.string(),
      })).optional().default([]),
      disclaimer: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      // Prüfe ob Slug bereits existiert
      const [existing] = await db
        .select({ id: taskTemplates.id })
        .from(taskTemplates)
        .where(eq(taskTemplates.slug, input.slug))
        .limit(1);

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Ein Template mit diesem Slug existiert bereits" });
      }

      // Eindeutige ID generieren: SP-YYYY-NNN
      const year = new Date().getFullYear();
      const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(taskTemplates);
      const count = (countResult[0]?.count || 0) + 1;
      const uniqueId = `SP-${year}-${String(count).padStart(3, '0')}`;

      const [result] = await db.insert(taskTemplates).values({
        slug: input.slug,
        name: input.name,
        title: input.title,
        description: input.description,
        shortDescription: input.shortDescription,
        categoryId: input.categoryId,
        businessAreaId: input.businessAreaId,
        icon: input.icon || "FileText",
        color: input.color,
        variableSchema: input.variableSchema || [],
        superprompt: input.superprompt,
        estimatedTimeSavings: input.estimatedTimeSavings,
        creditCost: input.creditCost || 1,
        llmModel: input.llmModel,
        llmTemperature: input.llmTemperature,
        maxTokens: input.maxTokens,
        outputFormat: input.outputFormat,
        exampleOutput: input.exampleOutput,
        // Dokument-Anforderungen
        documentRequired: input.documentRequired || 0,
        documentCount: input.documentCount || 1,
        allowedFileTypes: input.allowedFileTypes,
        maxFileSize: input.maxFileSize,
        maxPages: input.maxPages,
        documentRelevanceCheck: input.documentRelevanceCheck || 0,
        documentDescription: input.documentDescription,
        // Masking-Einstellungen
        maskingRequired: input.maskingRequired || 0,
        maskingTypes: input.maskingTypes,
        autoMasking: input.autoMasking || 0,
        // Keywords
        keywords: input.keywords,
        status: input.status || "draft",
        isFeatured: input.isFeatured || 0,
        isPublic: input.isPublic || 0,
        // Audit-Felder
        uniqueId,
        creationMethod: 'manual',
        createdBy: ctx.user.id,
        updatedBy: ctx.user.id,
        // Autor-Tracking (Fallback auf ctx.user.name)
        createdByName: input.createdByName || ctx.user.name || 'Admin',
        lastModifiedByName: input.createdByName || ctx.user.name || 'Admin',
        templateVersion: input.templateVersion || "1.0",
        changeLog: input.changeLog || "Erstellt",
        // ROI-Kalkulation
        roiBaseTimeMinutes: input.roiBaseTimeMinutes ?? 30,
        roiTimePerDocumentMinutes: input.roiTimePerDocumentMinutes ?? 15,
        roiKi2goTimeMinutes: input.roiKi2goTimeMinutes ?? 3,
        roiHourlyRate: input.roiHourlyRate ?? 80,
        roiTasksPerMonth: input.roiTasksPerMonth ?? 10,
        roiSources: input.roiSources || [],
        disclaimer: input.disclaimer || null,
      });

      await logAdminAction(ctx.user.id, "template.create", "taskTemplate", result.insertId, { slug: input.slug, title: input.title });

      return { id: result.insertId, slug: input.slug };
    }),

  // Template aktualisieren
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      slug: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, "Slug muss mit Buchstabe beginnen").optional(),
      name: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
      description: z.string().optional(),
      shortDescription: z.string().optional(),
      categoryId: z.number().nullable().optional(),
      businessAreaId: z.number().nullable().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      variableSchema: z.array(variableSchemaItem).optional(),
      superprompt: z.string().optional(),
      estimatedTimeSavings: z.number().nullable().optional(),
      creditCost: z.number().optional(),
      llmModel: z.string().optional(),
      llmTemperature: z.string().optional(),
      maxTokens: z.number().nullable().optional(),
      outputFormat: z.enum(["markdown", "json", "text", "html"]).optional(),
      exampleOutput: z.string().nullable().optional(),
      // Dokument-Anforderungen
      documentRequired: z.number().optional(),
      documentCount: z.number().optional(),
      allowedFileTypes: z.array(z.string()).optional(),
      maxFileSize: z.number().optional(),
      maxPages: z.number().nullable().optional(),
      documentRelevanceCheck: z.number().optional(),
      documentDescription: z.string().nullable().optional(),
      // Masking-Einstellungen
      maskingRequired: z.number().optional(),
      maskingTypes: z.array(z.string()).optional(),
      autoMasking: z.number().optional(),
      // Keywords
      keywords: z.array(z.string()).optional(),
      status: z.enum(["draft", "active", "archived"]).optional(),
      displayOrder: z.number().optional(),
      isFeatured: z.number().optional(),
      isPublic: z.number().optional(), // Öffentlich zugänglich für alle User
      // Autor-Tracking (optional - wird automatisch aus ctx.user.name gesetzt wenn leer)
      lastModifiedByName: z.string().optional(),
      templateVersion: z.string().optional(),
      changeLog: z.string().optional(),
      // ROI-Kalkulation
      roiBaseTimeMinutes: z.number().nullable().optional(),
      roiTimePerDocumentMinutes: z.number().nullable().optional(),
      roiKi2goTimeMinutes: z.number().nullable().optional(),
      roiKi2goTimePerDocument: z.number().nullable().optional(),
      roiHourlyRate: z.number().nullable().optional(),
      roiTasksPerMonth: z.number().nullable().optional(),
      roiSources: z.array(z.object({
        name: z.string(),
        url: z.string(),
        finding: z.string(),
      })).nullable().optional(),
      disclaimer: z.string().nullable().optional(),
      // Marketing-Felder
      marketingEnabled: z.number().optional(),
      marketingHeadline: z.string().nullable().optional(),
      marketingSubheadline: z.string().nullable().optional(),
      marketingUsps: z.array(z.string()).optional(),
      marketingCtaText: z.string().nullable().optional(),
      marketingMetaDescription: z.string().nullable().optional(),
      marketingKeywords: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const { 
        id, lastModifiedByName, templateVersion, changeLog, 
        roiBaseTimeMinutes, roiTimePerDocumentMinutes, roiKi2goTimeMinutes, roiKi2goTimePerDocument, roiHourlyRate, roiTasksPerMonth, roiSources, disclaimer,
        marketingEnabled, marketingHeadline, marketingSubheadline, marketingUsps, marketingCtaText, marketingMetaDescription, marketingKeywords,
        ...updateData 
      } = input;

      // Prüfe ob Template existiert
      const [existing] = await db
        .select()
        .from(taskTemplates)
        .where(eq(taskTemplates.id, id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template nicht gefunden" });
      }

      // Prüfe Slug-Eindeutigkeit wenn geändert
      if (updateData.slug && updateData.slug !== existing.slug) {
        const [slugExists] = await db
          .select({ id: taskTemplates.id })
          .from(taskTemplates)
          .where(eq(taskTemplates.slug, updateData.slug))
          .limit(1);

        if (slugExists) {
          throw new TRPCError({ code: "CONFLICT", message: "Ein Template mit diesem Slug existiert bereits" });
        }
      }

      // Erstelle Version wenn Superprompt geändert wird
      if (updateData.superprompt && updateData.superprompt !== existing.superprompt) {
        await db.insert(superpromptVersions).values({
          taskTemplateId: id,
          version: (existing.superpromptVersion || 0) + 1,
          superprompt: updateData.superprompt,
          variableSchema: updateData.variableSchema || existing.variableSchema,
          createdBy: ctx.user.id,
        });
        
        (updateData as any).superpromptVersion = (existing.superpromptVersion || 0) + 1;
      }

      await db
        .update(taskTemplates)
        .set({
          ...updateData,
          updatedBy: ctx.user.id,
          // Autor-Tracking automatisch aktualisieren (Fallback auf ctx.user.name)
          lastModifiedByName: lastModifiedByName || ctx.user.name || 'Admin',
          templateVersion: templateVersion || existing.templateVersion,
          changeLog: changeLog || existing.changeLog,
          // ROI-Kalkulation (nur wenn explizit gesetzt)
          ...(roiBaseTimeMinutes !== undefined && { roiBaseTimeMinutes }),
          ...(roiTimePerDocumentMinutes !== undefined && { roiTimePerDocumentMinutes }),
          ...(roiKi2goTimeMinutes !== undefined && { roiKi2goTimeMinutes }),
          ...(roiKi2goTimePerDocument !== undefined && { roiKi2goTimePerDocument }),
          ...(roiHourlyRate !== undefined && { roiHourlyRate }),
          ...(roiTasksPerMonth !== undefined && { roiTasksPerMonth }),
          ...(roiSources !== undefined && { roiSources }),
          ...(disclaimer !== undefined && { disclaimer }),
          // Marketing-Felder (nur wenn explizit gesetzt)
          ...(marketingEnabled !== undefined && { marketingEnabled }),
          ...(marketingHeadline !== undefined && { marketingHeadline }),
          ...(marketingSubheadline !== undefined && { marketingSubheadline }),
          ...(marketingUsps !== undefined && { marketingUsps }),
          ...(marketingCtaText !== undefined && { marketingCtaText }),
          ...(marketingMetaDescription !== undefined && { marketingMetaDescription }),
          ...(marketingKeywords !== undefined && { marketingKeywords }),
        })
        .where(eq(taskTemplates.id, id));

      await logAdminAction(ctx.user.id, "template.update", "taskTemplate", id, updateData);

      return { success: true };
    }),

  // Template löschen
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const [existing] = await db
        .select({ slug: taskTemplates.slug, title: taskTemplates.title })
        .from(taskTemplates)
        .where(eq(taskTemplates.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template nicht gefunden" });
      }

      // Lösche zugehörige Versionen
      await db.delete(superpromptVersions).where(eq(superpromptVersions.taskTemplateId, input.id));
      
      // Lösche Template
      await db.delete(taskTemplates).where(eq(taskTemplates.id, input.id));

      await logAdminAction(ctx.user.id, "template.delete", "taskTemplate", input.id, { slug: existing.slug, title: existing.title });

      return { success: true };
    }),

  // Template duplizieren
  duplicate: adminProcedure
    .input(z.object({ id: z.number(), newSlug: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const [original] = await db
        .select()
        .from(taskTemplates)
        .where(eq(taskTemplates.id, input.id))
        .limit(1);

      if (!original) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template nicht gefunden" });
      }

      // Prüfe ob neuer Slug bereits existiert
      const [slugExists] = await db
        .select({ id: taskTemplates.id })
        .from(taskTemplates)
        .where(eq(taskTemplates.slug, input.newSlug))
        .limit(1);

      if (slugExists) {
        throw new TRPCError({ code: "CONFLICT", message: "Ein Template mit diesem Slug existiert bereits" });
      }

      const [result] = await db.insert(taskTemplates).values({
        slug: input.newSlug,
        name: `${original.name} (Kopie)`,
        title: `${original.title} (Kopie)`,
        description: original.description,
        shortDescription: original.shortDescription,
        categoryId: original.categoryId,
        businessAreaId: original.businessAreaId,
        icon: original.icon,
        color: original.color,
        variableSchema: original.variableSchema,
        superprompt: original.superprompt,
        estimatedTimeSavings: original.estimatedTimeSavings,
        creditCost: original.creditCost,
        allowedFileTypes: original.allowedFileTypes,
        maxFileSize: original.maxFileSize,
        llmModel: original.llmModel,
        llmTemperature: original.llmTemperature,
        status: "draft",
        isFeatured: 0,
        createdBy: ctx.user.id,
        updatedBy: ctx.user.id,
      });

      await logAdminAction(ctx.user.id, "template.duplicate", "taskTemplate", result.insertId, { 
        originalId: input.id, 
        newSlug: input.newSlug 
      });

      return { id: result.insertId, slug: input.newSlug };
    }),

  // Status ändern (Aktivieren/Deaktivieren)
  toggleStatus: adminProcedure
    .input(z.object({ 
      id: z.number(), 
      status: z.enum(["draft", "active", "archived"]) 
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      await db
        .update(taskTemplates)
        .set({ 
          status: input.status,
          updatedBy: ctx.user.id,
        })
        .where(eq(taskTemplates.id, input.id));

      await logAdminAction(ctx.user.id, "template.toggleStatus", "taskTemplate", input.id, { status: input.status });

      return { success: true };
    }),

  // Versionen eines Templates laden
  getVersions: adminProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const versions = await db
        .select()
        .from(superpromptVersions)
        .where(eq(superpromptVersions.taskTemplateId, input.templateId))
        .orderBy(desc(superpromptVersions.version));

      return versions;
    }),

  // Marketing-Texte mit KI generieren
  generateMarketing: adminProcedure
    .input(z.object({
      templateId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      roiBaseTimeMinutes: z.number().optional(),
      roiTimePerDocumentMinutes: z.number().optional(),
      roiKi2goTimeMinutes: z.number().optional(),
      roiHourlyRate: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("../_core/llm");
      
      const roiInfo = input.roiBaseTimeMinutes 
        ? `\n\nROI-Daten:\n- Manuelle Bearbeitungszeit: ${input.roiBaseTimeMinutes} Minuten Basis + ${input.roiTimePerDocumentMinutes || 15} Minuten pro Dokument\n- KI2GO Bearbeitungszeit: ${input.roiKi2goTimeMinutes || 3} Minuten\n- Stundensatz: €${input.roiHourlyRate || 80}/h`
        : "";

      const prompt = `Du bist ein Marketing-Experte für B2B SaaS-Lösungen. Erstelle SEO-optimierte Marketing-Texte für folgende KI-Aufgabe:

Aufgaben-Titel: ${input.title}
Beschreibung: ${input.description || "Keine Beschreibung verfügbar"}${roiInfo}

Erstelle folgende Texte im JSON-Format:
1. headline: Eine prägnante, SEO-optimierte Headline (max. 60 Zeichen) - soll Aufmerksamkeit erregen und den Nutzen klar machen
2. subheadline: Ein Nutzenversprechen/Slogan (max. 100 Zeichen) - emotional und überzeugend
3. usps: Genau 3 USP-Punkte als Array - kurz, prägnant, nutzenorientiert (je max. 50 Zeichen)
4. ctaText: Call-to-Action Button Text (max. 25 Zeichen) - aktivierend, z.B. "Jetzt starten"
5. metaDescription: SEO Meta-Description (max. 155 Zeichen) - für Google Suchergebnisse optimiert
6. keywords: 5-7 relevante SEO-Keywords als Array

Wichtig:
- Verwende keine KI-Terminologie ("KI", "AI", "Algorithmus")
- Fokussiere auf Zeitersparnis und Effizienz
- Sprache: Professionell, aber nicht steif
- Zielgruppe: Geschäftsführer und Entscheider in KMUs

Antworte NUR mit validem JSON, keine Erklärungen.`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Du bist ein Marketing-Experte. Antworte immer nur mit validem JSON." },
            { role: "user", content: prompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "marketing_content",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  headline: { type: "string", description: "SEO-optimierte Headline, max 60 Zeichen" },
                  subheadline: { type: "string", description: "Nutzenversprechen/Slogan, max 100 Zeichen" },
                  usps: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "3 USP-Punkte" 
                  },
                  ctaText: { type: "string", description: "Call-to-Action Text, max 25 Zeichen" },
                  metaDescription: { type: "string", description: "SEO Meta-Description, max 155 Zeichen" },
                  keywords: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "5-7 SEO Keywords" 
                  }
                },
                required: ["headline", "subheadline", "usps", "ctaText", "metaDescription", "keywords"],
                additionalProperties: false
              }
            }
          }
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Keine Antwort vom LLM erhalten" });
        }

        const marketing = JSON.parse(content);
        return {
          headline: marketing.headline,
          subheadline: marketing.subheadline,
          usps: marketing.usps,
          ctaText: marketing.ctaText,
          metaDescription: marketing.metaDescription,
          keywords: marketing.keywords,
        };
      } catch (error) {
        console.error("[Marketing] Generierung fehlgeschlagen:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Marketing-Texte konnten nicht generiert werden" 
        });
      }
    }),

  // Disclaimer mit KI generieren
  generateDisclaimer: adminProcedure
    .input(z.object({
      templateId: z.number(),
      title: z.string(),
      description: z.string().optional(),
      superprompt: z.string().optional(),
      outputFormat: z.string().optional(),
      documentRequired: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("../_core/llm");
      
      const contextInfo = `
Aufgaben-Titel: ${input.title}
Beschreibung: ${input.description || "Keine Beschreibung verfügbar"}
Ausgabeformat: ${input.outputFormat || "markdown"}
Dokument erforderlich: ${input.documentRequired ? "Ja" : "Nein"}
${input.superprompt ? `\nSuperprompt-Auszug (erste 500 Zeichen): ${input.superprompt.substring(0, 500)}...` : ""}`;

      const prompt = `Du bist ein Rechtsexperte für KI-generierte Inhalte und Haftungsausschlüsse. Erstelle einen passenden, rechtlich fundierten Disclaimer für folgende KI-Aufgabe:
${contextInfo}

Der Disclaimer soll:
1. Klar kommunizieren, dass es sich um KI-generierte Inhalte handelt
2. Auf die Notwendigkeit menschlicher Überprüfung hinweisen
3. Haftungsausschlüsse für Fehler und Ungenauigkeiten enthalten
4. Spezifisch auf die Art der Aufgabe zugeschnitten sein
5. In professionellem, aber verständlichem Deutsch verfasst sein
6. Nicht länger als 3-4 Sätze sein

Wichtig:
- Verwende keine übertrieben juristischen Formulierungen
- Sei konkret und aufgabenspezifisch
- Erwähne relevante Aspekte wie Datenaktualität, Quellenvalidierung, etc.

Antworte NUR mit dem Disclaimer-Text, keine Erklärungen oder Formatierung.`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Du bist ein Rechtsexperte für KI-Disclaimer. Antworte nur mit dem Disclaimer-Text." },
            { role: "user", content: prompt }
          ],
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Keine Antwort vom LLM erhalten" });
        }

        return {
          disclaimer: content.trim(),
        };
      } catch (error) {
        console.error("[Disclaimer] Generierung fehlgeschlagen:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Disclaimer konnte nicht generiert werden" 
        });
      }
    }),

  // Marketing-Daten speichern
  updateMarketing: adminProcedure
    .input(z.object({
      id: z.number(),
      marketingEnabled: z.boolean(),
      marketingHeadline: z.string().max(100).optional(),
      marketingSubheadline: z.string().max(200).optional(),
      marketingUsps: z.array(z.string()).optional(),
      marketingCtaText: z.string().max(50).optional(),
      marketingMetaDescription: z.string().max(160).optional(),
      marketingKeywords: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const { id, ...marketingData } = input;

      await db
        .update(taskTemplates)
        .set({
          marketingEnabled: marketingData.marketingEnabled ? 1 : 0,
          marketingHeadline: marketingData.marketingHeadline || null,
          marketingSubheadline: marketingData.marketingSubheadline || null,
          marketingUsps: marketingData.marketingUsps || null,
          marketingCtaText: marketingData.marketingCtaText || null,
          marketingMetaDescription: marketingData.marketingMetaDescription || null,
          marketingKeywords: marketingData.marketingKeywords || null,
          updatedBy: ctx.user.id,
        })
        .where(eq(taskTemplates.id, id));

      await logAdminAction(ctx.user.id, "template.updateMarketing", "taskTemplate", id, marketingData);

      return { success: true };
    }),

  // Öffentliche Vorschau für nicht eingeloggte Besucher
  getPublicPreview: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbank nicht verfügbar" });

      const [template] = await db
        .select({
          id: taskTemplates.id,
          slug: taskTemplates.slug,
          title: taskTemplates.title,
          description: taskTemplates.description,
          shortDescription: taskTemplates.shortDescription,
          icon: taskTemplates.icon,
          color: taskTemplates.color,
          // ROI-Daten
          roiBaseTimeMinutes: taskTemplates.roiBaseTimeMinutes,
          roiTimePerDocumentMinutes: taskTemplates.roiTimePerDocumentMinutes,
          roiKi2goTimeMinutes: taskTemplates.roiKi2goTimeMinutes,
          roiKi2goTimePerDocument: taskTemplates.roiKi2goTimePerDocument,
          roiHourlyRate: taskTemplates.roiHourlyRate,
          roiTasksPerMonth: taskTemplates.roiTasksPerMonth,
          roiSources: taskTemplates.roiSources,
          estimatedTimeSavings: taskTemplates.estimatedTimeSavings,
          // Marketing-Daten
          marketingEnabled: taskTemplates.marketingEnabled,
          marketingHeadline: taskTemplates.marketingHeadline,
          marketingSubheadline: taskTemplates.marketingSubheadline,
          marketingUsps: taskTemplates.marketingUsps,
          marketingCtaText: taskTemplates.marketingCtaText,
          marketingMetaDescription: taskTemplates.marketingMetaDescription,
          // Beispiel-Output (öffentlich)
          exampleOutput: taskTemplates.exampleOutput,
          // Variablen-Schema (nur für Labels)
          variableSchema: taskTemplates.variableSchema,
          // Dokument-Info
          documentRequired: taskTemplates.documentRequired,
          documentCount: taskTemplates.documentCount,
          documentDescription: taskTemplates.documentDescription,
          // Kategorie
          categoryId: taskTemplates.categoryId,
          categoryName: categories.name,
          categoryIcon: categories.icon,
          // Bereich
          businessAreaId: taskTemplates.businessAreaId,
          businessAreaName: businessAreas.name,
          businessAreaIcon: businessAreas.icon,
          // Nutzungsstatistik
          usageCount: taskTemplates.usageCount,
          avgRating: taskTemplates.avgRating,
        })
        .from(taskTemplates)
        .leftJoin(categories, eq(taskTemplates.categoryId, categories.id))
        .leftJoin(businessAreas, eq(taskTemplates.businessAreaId, businessAreas.id))
        .where(and(
          eq(taskTemplates.slug, input.slug),
          eq(taskTemplates.status, "active"),
          eq(taskTemplates.isPublic, 1) // Nur öffentliche Templates
        ))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aufgabe nicht gefunden oder nicht öffentlich" });
      }

      // Variablen-Schema aufbereiten (nur Labels und Typen, keine sensiblen Details)
      let publicVariables: { label: string; type: string; required: boolean }[] = [];
      if (template.variableSchema) {
        const schema = typeof template.variableSchema === 'string' 
          ? JSON.parse(template.variableSchema) 
          : template.variableSchema;
        publicVariables = schema.map((v: any) => ({
          label: v.label,
          type: v.type,
          required: v.required || false,
        }));
      }

      // ROI berechnen
      const baseTime = template.roiBaseTimeMinutes || 30;
      const perDocTime = template.roiTimePerDocumentMinutes || 15;
      const ki2goTime = template.roiKi2goTimeMinutes || 3;
      const ki2goPerDocTime = template.roiKi2goTimePerDocument || 1;
      const hourlyRate = template.roiHourlyRate || 80;
      
      const manualTime1Doc = baseTime + perDocTime;
      const ki2goTime1Doc = ki2goTime;
      const savedTime1Doc = manualTime1Doc - ki2goTime1Doc;
      const savedMoney1Doc = (savedTime1Doc / 60) * hourlyRate;
      
      const manualTime3Doc = baseTime + (perDocTime * 3);
      const ki2goTime3Doc = ki2goTime + (ki2goPerDocTime * 2); // Basiszeit + 2 zusätzliche Dokumente
      const savedTime3Doc = manualTime3Doc - ki2goTime3Doc;
      const savedMoney3Doc = (savedTime3Doc / 60) * hourlyRate;

      return {
        ...template,
        // Entferne das rohe variableSchema und ersetze durch öffentliche Version
        variableSchema: undefined,
        publicVariables,
        // ROI-Berechnungen
        roi: {
          oneDocument: {
            manualTimeMinutes: manualTime1Doc,
            ki2goTimeMinutes: ki2goTime1Doc,
            savedTimeMinutes: savedTime1Doc,
            savedMoneyEuros: Math.round(savedMoney1Doc * 100) / 100,
          },
          threeDocuments: {
            manualTimeMinutes: manualTime3Doc,
            ki2goTimeMinutes: ki2goTime3Doc,
            savedTimeMinutes: savedTime3Doc,
            savedMoneyEuros: Math.round(savedMoney3Doc * 100) / 100,
          },
          hourlyRate,
          tasksPerMonth: template.roiTasksPerMonth || 10,
          sources: template.roiSources || [],
        },
      };
    }),

  // Magic ROI - KI analysiert Superprompt und schlägt ROI-Werte vor
  analyzeRoi: adminProcedure
    .input(z.object({
      superprompt: z.string().min(1),
      title: z.string().optional(),
      description: z.string().optional(),
      variableCount: z.number().optional(),
      documentRequired: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("../_core/llm");

      const prompt = `Du bist ein Experte für Geschäftsprozess-Analyse und Zeitschätzung. Analysiere den folgenden Superprompt und schätze realistische Zeitwerte für die manuelle vs. KI-gestützte Bearbeitung.

Superprompt:
${input.superprompt}

${input.title ? `Aufgaben-Titel: ${input.title}` : ''}
${input.description ? `Beschreibung: ${input.description}` : ''}
${input.variableCount ? `Anzahl Variablen: ${input.variableCount}` : ''}
${input.documentRequired ? 'Dokument-Upload erforderlich: Ja' : ''}

Analysiere basierend auf:
1. Komplexität des Prompts (Länge, Struktur, Anforderungen)
2. Art der Aufgabe (Recherche, Analyse, Erstellung, Prüfung)
3. Typischer manueller Aufwand für solche Aufgaben
4. Anzahl der benötigten Eingaben/Variablen
5. Ob Dokumente analysiert werden müssen

Schätze folgende Werte:
- roiBaseTimeMinutes: Grundzeit für manuelle Bearbeitung OHNE Dokumente (typisch 15-60 Min)
- roiTimePerDocumentMinutes: Zusätzliche Zeit PRO Dokument bei manueller Bearbeitung (typisch 10-30 Min)
- roiKi2goTimeMinutes: KI2GO Basis-Bearbeitungszeit (typisch 2-5 Min)
- roiKi2goTimePerDocument: Zusätzliche KI2GO-Zeit pro Dokument (typisch 0-2 Min)
- reasoning: Kurze Begründung der Schätzung (max 100 Zeichen)

Antworte NUR mit validem JSON.`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Du bist ein Experte für Prozessanalyse. Antworte immer nur mit validem JSON." },
            { role: "user", content: prompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "roi_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  roiBaseTimeMinutes: { type: "integer", description: "Manuelle Basis-Zeit in Minuten" },
                  roiTimePerDocumentMinutes: { type: "integer", description: "Manuelle Zeit pro Dokument" },
                  roiKi2goTimeMinutes: { type: "integer", description: "KI2GO Basis-Zeit" },
                  roiKi2goTimePerDocument: { type: "integer", description: "KI2GO Zeit pro Dokument" },
                  reasoning: { type: "string", description: "Kurze Begründung" },
                },
                required: ["roiBaseTimeMinutes", "roiTimePerDocumentMinutes", "roiKi2goTimeMinutes", "roiKi2goTimePerDocument", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== 'string') {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Keine Antwort von der KI" });
        }

        const result = JSON.parse(content);
        
        // Validiere und begrenzen die Werte auf sinnvolle Bereiche
        return {
          roiBaseTimeMinutes: Math.min(Math.max(result.roiBaseTimeMinutes || 30, 5), 120),
          roiTimePerDocumentMinutes: Math.min(Math.max(result.roiTimePerDocumentMinutes || 15, 0), 60),
          roiKi2goTimeMinutes: Math.min(Math.max(result.roiKi2goTimeMinutes || 3, 1), 15),
          roiKi2goTimePerDocument: Math.min(Math.max(result.roiKi2goTimePerDocument || 1, 0), 5),
          reasoning: result.reasoning || "Basierend auf Prompt-Analyse",
        };
      } catch (error) {
        console.error("ROI-Analyse Fehler:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "ROI-Analyse fehlgeschlagen" 
        });
      }
    }),
});
