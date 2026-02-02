import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { customSuperprompts, customSuperpromptHistory, taskTemplates, users, organizations, templateChangeRequests } from "../../drizzle/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";

// Helper: Bestimme den Template-Typ basierend auf organizationId und userId
function getTargetType(organizationId: number | null, userId: number | null): "global" | "organization" | "user" {
  if (userId) return "user";
  if (organizationId) return "organization";
  return "global";
}

export const customSuperpromptRouter = router({
  // Alle Custom-Superprompts laden (nur für Owner)
  getAll: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      baseTemplateId: z.number().optional(),
      targetType: z.enum(["all", "global", "organization", "user"]).default("all"),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur der Owner kann Custom-Templates verwalten" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });
      const offset = (input.page - 1) * input.limit;

      let templates = await db
        .select({
          id: customSuperprompts.id,
          baseTemplateId: customSuperprompts.baseTemplateId,
          sourceTemplateUniqueId: customSuperprompts.sourceTemplateUniqueId,
          organizationId: customSuperprompts.organizationId,
          userId: customSuperprompts.userId,
          name: customSuperprompts.name,
          description: customSuperprompts.description,
          isActive: customSuperprompts.isActive,
          version: customSuperprompts.version,
          usageCount: customSuperprompts.usageCount,
          lastUsedAt: customSuperprompts.lastUsedAt,
          createdAt: customSuperprompts.createdAt,
          updatedAt: customSuperprompts.updatedAt,
        })
        .from(customSuperprompts)
        .orderBy(desc(customSuperprompts.updatedAt))
        .limit(input.limit)
        .offset(offset);

      if (input.baseTemplateId) {
        templates = templates.filter(t => t.baseTemplateId === input.baseTemplateId);
      }
      if (input.targetType !== "all") {
        templates = templates.filter(t => getTargetType(t.organizationId, t.userId) === input.targetType);
      }

      const enrichedTemplates = await Promise.all(templates.map(async (t) => {
        const [baseTemplate] = await db
          .select({ name: taskTemplates.name })
          .from(taskTemplates)
          .where(eq(taskTemplates.id, t.baseTemplateId))
          .limit(1);

        let targetName = "Global";
        if (t.userId) {
          const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, t.userId)).limit(1);
          targetName = user?.name || `User #${t.userId}`;
        } else if (t.organizationId) {
          const [org] = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, t.organizationId)).limit(1);
          targetName = org?.name || `Org #${t.organizationId}`;
        }

        return {
          ...t,
          baseTemplateName: baseTemplate?.name || t.sourceTemplateUniqueId || "Unbekannt",
          targetType: getTargetType(t.organizationId, t.userId),
          targetName,
        };
      }));

      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(customSuperprompts);

      return {
        templates: enrichedTemplates,
        total: countResult?.count || 0,
        page: input.page,
        limit: input.limit,
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });
      
      const [template] = await db
        .select()
        .from(customSuperprompts)
        .where(eq(customSuperprompts.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template nicht gefunden" });
      }

      const history = await db
        .select()
        .from(customSuperpromptHistory)
        .where(eq(customSuperpromptHistory.customSuperpromptId, input.id))
        .orderBy(desc(customSuperpromptHistory.version));

      const [baseTemplate] = await db
        .select({ name: taskTemplates.name, superprompt: taskTemplates.superprompt })
        .from(taskTemplates)
        .where(eq(taskTemplates.id, template.baseTemplateId))
        .limit(1);

      return {
        ...template,
        targetType: getTargetType(template.organizationId, template.userId),
        baseTemplateName: baseTemplate?.name || "Unbekannt",
        baseSuperprompt: baseTemplate?.superprompt,
        history,
      };
    }),

  // Vollständige Template-Daten für den universellen Editor laden
  getForEdit: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });
      
      const { categories, businessAreas } = await import("../../drizzle/schema");
      
      const [template] = await db
        .select()
        .from(customSuperprompts)
        .where(eq(customSuperprompts.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template nicht gefunden" });
      }

      // Lade Kategorie und Unternehmensbereich
      let categoryName = null;
      let businessAreaName = null;
      
      if (template.categoryId) {
        const [cat] = await db.select({ name: categories.name }).from(categories).where(eq(categories.id, template.categoryId)).limit(1);
        categoryName = cat?.name;
      }
      
      if (template.businessAreaId) {
        const [ba] = await db.select({ name: businessAreas.name }).from(businessAreas).where(eq(businessAreas.id, template.businessAreaId)).limit(1);
        businessAreaName = ba?.name;
      }

      // Lade Organisation
      let organizationName = null;
      let customerNumber = null;
      if (template.organizationId) {
        const [org] = await db.select({ name: organizations.name, customerNumber: organizations.customerNumber }).from(organizations).where(eq(organizations.id, template.organizationId)).limit(1);
        organizationName = org?.name;
        customerNumber = org?.customerNumber;
      }

      // Lade Basis-Template
      const [baseTemplate] = await db
        .select({
          name: taskTemplates.name,
          uniqueId: taskTemplates.uniqueId,
          superprompt: taskTemplates.superprompt,
        })
        .from(taskTemplates)
        .where(eq(taskTemplates.id, template.baseTemplateId))
        .limit(1);

      // Lade History
      const history = await db
        .select()
        .from(customSuperpromptHistory)
        .where(eq(customSuperpromptHistory.customSuperpromptId, input.id))
        .orderBy(desc(customSuperpromptHistory.version))
        .limit(10);

      return {
        ...template,
        // Angereicherte Daten
        categoryName,
        businessAreaName,
        organizationName,
        customerNumber,
        baseTemplateName: baseTemplate?.name || "Unbekannt",
        baseTemplateUniqueId: baseTemplate?.uniqueId,
        baseSuperprompt: baseTemplate?.superprompt,
        targetType: getTargetType(template.organizationId, template.userId),
        history,
      };
    }),

  create: protectedProcedure
    .input(z.object({
      baseTemplateId: z.number(),
      organizationId: z.number().nullable().optional(),
      userId: z.number().nullable().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      superprompt: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const [baseTemplate] = await db
        .select()
        .from(taskTemplates)
        .where(eq(taskTemplates.id, input.baseTemplateId))
        .limit(1);

      if (!baseTemplate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Basis-Template nicht gefunden" });
      }

      const [result] = await db.insert(customSuperprompts).values({
        baseTemplateId: input.baseTemplateId,
        organizationId: input.organizationId || null,
        userId: input.userId || null,
        name: input.name,
        description: input.description || null,
        superprompt: input.superprompt,
        createdBy: ctx.user.id,
        isActive: 1,
        version: 1,
        usageCount: 0,
      });

      await db.insert(customSuperpromptHistory).values({
        customSuperpromptId: result.insertId,
        version: 1,
        superprompt: input.superprompt,
        changedBy: ctx.user.id,
        changeDescription: "Initiale Version erstellt",
      });

      return { id: result.insertId, success: true };
    }),

  createFromExecution: protectedProcedure
    .input(z.object({
      executionId: z.number(),
      organizationId: z.number().nullable().optional(),
      userId: z.number().nullable().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });
      const { workflowExecutions } = await import("../../drizzle/schema");
      
      const [execution] = await db
        .select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.id, input.executionId))
        .limit(1);

      if (!execution) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ausführung nicht gefunden" });
      }

      if (!execution.superpromptUsed) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ausführung hat keinen generierten Superprompt" });
      }

      const [result] = await db.insert(customSuperprompts).values({
        baseTemplateId: execution.templateId,
        organizationId: input.organizationId || null,
        userId: input.userId || null,
        name: input.name,
        description: input.description || null,
        superprompt: execution.superpromptUsed,
        createdFromExecutionId: input.executionId,
        createdBy: ctx.user.id,
        isActive: 1,
        version: 1,
        usageCount: 0,
      });

      await db.insert(customSuperpromptHistory).values({
        customSuperpromptId: result.insertId,
        version: 1,
        superprompt: execution.superpromptUsed,
        changedBy: ctx.user.id,
        changeDescription: `Erstellt aus Ausführung #${input.executionId}`,
      });

      return { id: result.insertId, success: true };
    }),

  // Vollständige Update-Mutation für den universellen Template-Editor
  updateFull: protectedProcedure
    .input(z.object({
      id: z.number(),
      // Grunddaten
      name: z.string().min(1).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      shortDescription: z.string().optional(),
      superprompt: z.string().min(1).optional(),
      // Kategorisierung
      categoryId: z.number().nullable().optional(),
      businessAreaId: z.number().nullable().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      // Variablen
      variableSchema: z.array(z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(['text', 'textarea', 'number', 'select', 'date', 'boolean', 'file']),
        required: z.boolean(),
        placeholder: z.string().optional(),
        defaultValue: z.any().optional(),
        options: z.array(z.string()).optional(),
        helpText: z.string().optional(),
        validation: z.object({
          min: z.number().optional(),
          max: z.number().optional(),
          pattern: z.string().optional(),
        }).optional(),
      })).optional(),
      // LLM-Einstellungen
      estimatedTimeSavings: z.number().optional(),
      creditCost: z.number().optional(),
      llmModel: z.string().optional(),
      llmTemperature: z.number().optional(),
      maxTokens: z.number().optional(),
      outputFormat: z.enum(['markdown', 'json', 'text', 'html']).optional(),
      exampleOutput: z.string().optional(),
      // Dokument-Einstellungen
      documentRequired: z.number().optional(),
      documentCount: z.number().optional(),
      allowedFileTypes: z.array(z.string()).optional(),
      maxFileSize: z.number().optional(),
      maxPages: z.number().optional(),
      documentRelevanceCheck: z.number().optional(),
      documentDescription: z.string().optional(),
      // Masking
      maskingRequired: z.number().optional(),
      maskingTypes: z.array(z.string()).optional(),
      autoMasking: z.number().optional(),
      // Keywords
      keywords: z.array(z.string()).optional(),
      // Marketing
      marketingEnabled: z.number().optional(),
      marketingHeadline: z.string().optional(),
      marketingSubheadline: z.string().optional(),
      marketingUsps: z.array(z.string()).optional(),
      marketingCtaText: z.string().optional(),
      marketingMetaDescription: z.string().optional(),
      marketingKeywords: z.array(z.string()).optional(),
      // ROI
      roiBaseTimeMinutes: z.number().optional(),
      roiTimePerDocumentMinutes: z.number().optional(),
      roiKi2goTimeMinutes: z.number().optional(),
      roiKi2goTimePerDocument: z.number().optional(),
      roiHourlyRate: z.number().optional(),
      roiTasksPerMonth: z.number().optional(),
      roiSources: z.array(z.object({
        name: z.string(),
        url: z.string(),
        finding: z.string(),
      })).optional(),
      disclaimer: z.string().nullable().optional(),
      // Status
      status: z.enum(["active", "paused", "archived", "change_requested"]).optional(),
      // Autor-Tracking
      templateVersion: z.string().optional(),
      changeLog: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const [current] = await db
        .select()
        .from(customSuperprompts)
        .where(eq(customSuperprompts.id, input.id))
        .limit(1);

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const newVersion = current.version + 1;
      const newSuperprompt = input.superprompt || current.superprompt;

      // Erstelle Update-Objekt nur mit definierten Werten
      const updateData: Record<string, any> = {
        version: newVersion,
        lastModifiedByName: ctx.user.name || 'Admin',
      };

      // Grunddaten
      if (input.name !== undefined) updateData.name = input.name;
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.shortDescription !== undefined) updateData.shortDescription = input.shortDescription;
      if (input.superprompt !== undefined) updateData.superprompt = input.superprompt;

      // Kategorisierung
      if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
      if (input.businessAreaId !== undefined) updateData.businessAreaId = input.businessAreaId;
      if (input.icon !== undefined) updateData.icon = input.icon;
      if (input.color !== undefined) updateData.color = input.color;

      // Variablen
      if (input.variableSchema !== undefined) updateData.variableSchema = input.variableSchema;

      // LLM-Einstellungen
      if (input.estimatedTimeSavings !== undefined) updateData.estimatedTimeSavings = input.estimatedTimeSavings;
      if (input.creditCost !== undefined) updateData.creditCost = input.creditCost;
      if (input.llmModel !== undefined) updateData.llmModel = input.llmModel;
      if (input.llmTemperature !== undefined) updateData.llmTemperature = String(input.llmTemperature);
      if (input.maxTokens !== undefined) updateData.maxTokens = input.maxTokens;
      if (input.outputFormat !== undefined) updateData.outputFormat = input.outputFormat;
      if (input.exampleOutput !== undefined) updateData.exampleOutput = input.exampleOutput;

      // Dokument-Einstellungen
      if (input.documentRequired !== undefined) updateData.documentRequired = input.documentRequired;
      if (input.documentCount !== undefined) updateData.documentCount = input.documentCount;
      if (input.allowedFileTypes !== undefined) updateData.allowedFileTypes = input.allowedFileTypes;
      if (input.maxFileSize !== undefined) updateData.maxFileSize = input.maxFileSize;
      if (input.maxPages !== undefined) updateData.maxPages = input.maxPages;
      if (input.documentRelevanceCheck !== undefined) updateData.documentRelevanceCheck = input.documentRelevanceCheck;
      if (input.documentDescription !== undefined) updateData.documentDescription = input.documentDescription;

      // Masking
      if (input.maskingRequired !== undefined) updateData.maskingRequired = input.maskingRequired;
      if (input.maskingTypes !== undefined) updateData.maskingTypes = input.maskingTypes;
      if (input.autoMasking !== undefined) updateData.autoMasking = input.autoMasking;

      // Keywords
      if (input.keywords !== undefined) updateData.keywords = input.keywords;

      // Marketing
      if (input.marketingEnabled !== undefined) updateData.marketingEnabled = input.marketingEnabled;
      if (input.marketingHeadline !== undefined) updateData.marketingHeadline = input.marketingHeadline;
      if (input.marketingSubheadline !== undefined) updateData.marketingSubheadline = input.marketingSubheadline;
      if (input.marketingUsps !== undefined) updateData.marketingUsps = input.marketingUsps;
      if (input.marketingCtaText !== undefined) updateData.marketingCtaText = input.marketingCtaText;
      if (input.marketingMetaDescription !== undefined) updateData.marketingMetaDescription = input.marketingMetaDescription;
      if (input.marketingKeywords !== undefined) updateData.marketingKeywords = input.marketingKeywords;

      // ROI
      if (input.roiBaseTimeMinutes !== undefined) updateData.roiBaseTimeMinutes = input.roiBaseTimeMinutes;
      if (input.roiTimePerDocumentMinutes !== undefined) updateData.roiTimePerDocumentMinutes = input.roiTimePerDocumentMinutes;
      if (input.roiKi2goTimeMinutes !== undefined) updateData.roiKi2goTimeMinutes = input.roiKi2goTimeMinutes;
      if (input.roiKi2goTimePerDocument !== undefined) updateData.roiKi2goTimePerDocument = input.roiKi2goTimePerDocument;
      if (input.roiHourlyRate !== undefined) updateData.roiHourlyRate = input.roiHourlyRate;
      if (input.roiTasksPerMonth !== undefined) updateData.roiTasksPerMonth = input.roiTasksPerMonth;
      if (input.roiSources !== undefined) updateData.roiSources = input.roiSources;
      if (input.disclaimer !== undefined) updateData.disclaimer = input.disclaimer;
      
      // Status
      if (input.status !== undefined) updateData.status = input.status;

      // Autor-Tracking
      if (input.templateVersion !== undefined) updateData.templateVersion = input.templateVersion;
      if (input.changeLog !== undefined) updateData.changeLog = input.changeLog;

      await db
        .update(customSuperprompts)
        .set(updateData)
        .where(eq(customSuperprompts.id, input.id));

      // Wenn Superprompt geändert, in History speichern
      if (input.superprompt) {
        await db.insert(customSuperpromptHistory).values({
          customSuperpromptId: input.id,
          version: newVersion,
          superprompt: newSuperprompt,
          changedBy: ctx.user.id,
          changeDescription: input.changeLog || 'Template aktualisiert',
        });
      }

      return { success: true, newVersion };
    }),

  // Legacy update-Mutation für Abwärtskompatibilität
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      superprompt: z.string().min(1).optional(),
      changeDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const [current] = await db
        .select()
        .from(customSuperprompts)
        .where(eq(customSuperprompts.id, input.id))
        .limit(1);

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const newVersion = current.version + 1;
      const newSuperprompt = input.superprompt || current.superprompt;

      await db
        .update(customSuperprompts)
        .set({
          name: input.name || current.name,
          description: input.description !== undefined ? input.description : current.description,
          superprompt: newSuperprompt,
          version: newVersion,
        })
        .where(eq(customSuperprompts.id, input.id));

      if (input.superprompt) {
        await db.insert(customSuperpromptHistory).values({
          customSuperpromptId: input.id,
          version: newVersion,
          superprompt: newSuperprompt,
          changedBy: ctx.user.id,
          changeDescription: input.changeDescription || `Version ${newVersion}`,
        });
      }

      return { success: true, newVersion };
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const [current] = await db
        .select({ isActive: customSuperprompts.isActive })
        .from(customSuperprompts)
        .where(eq(customSuperprompts.id, input.id))
        .limit(1);

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const newIsActive = current.isActive === 1 ? 0 : 1;
      await db
        .update(customSuperprompts)
        .set({ isActive: newIsActive })
        .where(eq(customSuperprompts.id, input.id));

      return { success: true, isActive: newIsActive === 1 };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      await db
        .delete(customSuperpromptHistory)
        .where(eq(customSuperpromptHistory.customSuperpromptId, input.id));

      await db
        .delete(customSuperprompts)
        .where(eq(customSuperprompts.id, input.id));

      return { success: true };
    }),

  findBestTemplate: protectedProcedure
    .input(z.object({
      baseTemplateId: z.number(),
      userId: z.number(),
      organizationId: z.number().nullable(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      if (input.userId) {
        const [userTemplate] = await db
          .select()
          .from(customSuperprompts)
          .where(and(
            eq(customSuperprompts.baseTemplateId, input.baseTemplateId),
            eq(customSuperprompts.userId, input.userId),
            eq(customSuperprompts.isActive, 1)
          ))
          .limit(1);

        if (userTemplate) {
          return { template: userTemplate, type: "user" as const };
        }
      }

      if (input.organizationId) {
        const [orgTemplate] = await db
          .select()
          .from(customSuperprompts)
          .where(and(
            eq(customSuperprompts.baseTemplateId, input.baseTemplateId),
            eq(customSuperprompts.organizationId, input.organizationId),
            isNull(customSuperprompts.userId),
            eq(customSuperprompts.isActive, 1)
          ))
          .limit(1);

        if (orgTemplate) {
          return { template: orgTemplate, type: "organization" as const };
        }
      }

      const [globalTemplate] = await db
        .select()
        .from(customSuperprompts)
        .where(and(
          eq(customSuperprompts.baseTemplateId, input.baseTemplateId),
          isNull(customSuperprompts.organizationId),
          isNull(customSuperprompts.userId),
          eq(customSuperprompts.isActive, 1)
        ))
        .limit(1);

      if (globalTemplate) {
        return { template: globalTemplate, type: "global" as const };
      }

      return { template: null, type: "base" as const };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "owner") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });
    const templates = await db.select().from(customSuperprompts);

    const stats = {
      total: templates.length,
      active: templates.filter(t => t.isActive).length,
      inactive: templates.filter(t => !t.isActive).length,
      byType: {
        global: templates.filter(t => !t.organizationId && !t.userId).length,
        organization: templates.filter(t => t.organizationId && !t.userId).length,
        user: templates.filter(t => t.userId).length,
      },
      totalUsage: templates.reduce((sum, t) => sum + (t.usageCount || 0), 0),
    };

    return stats;
  }),

  // ==================== NEUE APIs für Custom-Templates Verwaltung ====================

  // Erweiterte Statistiken mit Gruppierung nach Firma und Basis-Template
  getExtendedStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "owner") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

    // Alle Custom-Templates mit Joins
    const templates = await db
      .select({
        id: customSuperprompts.id,
        uniqueId: customSuperprompts.uniqueId,
        baseTemplateId: customSuperprompts.baseTemplateId,
        organizationId: customSuperprompts.organizationId,
        userId: customSuperprompts.userId,
        isActive: customSuperprompts.isActive,
        status: customSuperprompts.status,
        usageCount: customSuperprompts.usageCount,
        lastUsedAt: customSuperprompts.lastUsedAt,
        orgName: organizations.name,
        orgCustomerNumber: organizations.customerNumber,
        baseTemplateName: taskTemplates.name,
        baseTemplateUniqueId: taskTemplates.uniqueId,
      })
      .from(customSuperprompts)
      .leftJoin(organizations, eq(customSuperprompts.organizationId, organizations.id))
      .leftJoin(taskTemplates, eq(customSuperprompts.baseTemplateId, taskTemplates.id));

    // Gruppierung nach Firma
    const byOrganization: Record<string, { name: string; customerNumber: string | null; count: number; usage: number }> = {};
    templates.forEach(t => {
      if (t.organizationId) {
        const key = String(t.organizationId);
        if (!byOrganization[key]) {
          byOrganization[key] = {
            name: t.orgName || `Org #${t.organizationId}`,
            customerNumber: t.orgCustomerNumber,
            count: 0,
            usage: 0,
          };
        }
        byOrganization[key].count++;
        byOrganization[key].usage += t.usageCount || 0;
      }
    });

    // Gruppierung nach Basis-Template
    const byBaseTemplate: Record<string, { name: string; uniqueId: string | null; count: number; usage: number }> = {};
    templates.forEach(t => {
      const key = String(t.baseTemplateId);
      if (!byBaseTemplate[key]) {
        byBaseTemplate[key] = {
          name: t.baseTemplateName || `Template #${t.baseTemplateId}`,
          uniqueId: t.baseTemplateUniqueId,
          count: 0,
          usage: 0,
        };
      }
      byBaseTemplate[key].count++;
      byBaseTemplate[key].usage += t.usageCount || 0;
    });

    // Status-Verteilung
    const byStatus = {
      active: templates.filter(t => t.status === 'active' || (t.status === null && t.isActive)).length,
      paused: templates.filter(t => t.status === 'paused').length,
      archived: templates.filter(t => t.status === 'archived').length,
      changeRequested: templates.filter(t => t.status === 'change_requested').length,
    };

    return {
      total: templates.length,
      byStatus,
      byOrganization: Object.values(byOrganization).sort((a, b) => b.count - a.count),
      byBaseTemplate: Object.values(byBaseTemplate).sort((a, b) => b.count - a.count),
      totalUsage: templates.reduce((sum, t) => sum + (t.usageCount || 0), 0),
    };
  }),

  // Alle Custom-Templates mit erweiterten Informationen (für neue Admin-Übersicht)
  getAllWithDetails: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      search: z.string().optional(),
      organizationId: z.number().optional(),
      baseTemplateId: z.number().optional(),
      status: z.enum(["all", "active", "paused", "archived", "change_requested"]).default("all"),
      sortBy: z.enum(["name", "uniqueId", "usageCount", "lastUsedAt", "createdAt", "organizationName"]).default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      // Hole alle Custom-Templates mit Joins
      let allTemplates = await db
        .select({
          id: customSuperprompts.id,
          uniqueId: customSuperprompts.uniqueId,
          sourceTemplateUniqueId: customSuperprompts.sourceTemplateUniqueId,
          baseTemplateId: customSuperprompts.baseTemplateId,
          organizationId: customSuperprompts.organizationId,
          userId: customSuperprompts.userId,
          name: customSuperprompts.name,
          description: customSuperprompts.description,
          isActive: customSuperprompts.isActive,
          status: customSuperprompts.status,
          version: customSuperprompts.version,
          usageCount: customSuperprompts.usageCount,
          lastUsedAt: customSuperprompts.lastUsedAt,
          createdAt: customSuperprompts.createdAt,
          updatedAt: customSuperprompts.updatedAt,
          // Joined fields
          organizationName: organizations.name,
          customerNumber: organizations.customerNumber,
          baseTemplateName: taskTemplates.name,
          baseTemplateUniqueId: taskTemplates.uniqueId,
        })
        .from(customSuperprompts)
        .leftJoin(organizations, eq(customSuperprompts.organizationId, organizations.id))
        .leftJoin(taskTemplates, eq(customSuperprompts.baseTemplateId, taskTemplates.id));

      // Filter anwenden
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        allTemplates = allTemplates.filter(t => 
          t.name.toLowerCase().includes(searchLower) ||
          t.uniqueId?.toLowerCase().includes(searchLower) ||
          t.organizationName?.toLowerCase().includes(searchLower) ||
          t.customerNumber?.toLowerCase().includes(searchLower)
        );
      }

      if (input.organizationId) {
        allTemplates = allTemplates.filter(t => t.organizationId === input.organizationId);
      }

      if (input.baseTemplateId) {
        allTemplates = allTemplates.filter(t => t.baseTemplateId === input.baseTemplateId);
      }

      if (input.status !== "all") {
        allTemplates = allTemplates.filter(t => {
          if (input.status === "active") return t.status === "active" || (t.status === null && t.isActive);
          return t.status === input.status;
        });
      }

      // Sortierung
      allTemplates.sort((a, b) => {
        let comparison = 0;
        switch (input.sortBy) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "uniqueId":
            comparison = (a.uniqueId || "").localeCompare(b.uniqueId || "");
            break;
          case "usageCount":
            comparison = (a.usageCount || 0) - (b.usageCount || 0);
            break;
          case "lastUsedAt":
            comparison = (a.lastUsedAt?.getTime() || 0) - (b.lastUsedAt?.getTime() || 0);
            break;
          case "organizationName":
            comparison = (a.organizationName || "").localeCompare(b.organizationName || "");
            break;
          default:
            comparison = (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
        }
        return input.sortOrder === "desc" ? -comparison : comparison;
      });

      // Pagination
      const total = allTemplates.length;
      const offset = (input.page - 1) * input.limit;
      const paginatedTemplates = allTemplates.slice(offset, offset + input.limit);

      // User-Namen für userId hinzufügen
      const enrichedTemplates = await Promise.all(paginatedTemplates.map(async (t) => {
        let userName = null;
        if (t.userId) {
          const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, t.userId)).limit(1);
          userName = user?.name || `User #${t.userId}`;
        }
        return {
          ...t,
          userName,
          targetType: getTargetType(t.organizationId, t.userId),
        };
      }));

      return {
        templates: enrichedTemplates,
        total,
        page: input.page,
        limit: input.limit,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // Kundenzuweisung ändern
  assignToOrganization: protectedProcedure
    .input(z.object({
      id: z.number(),
      organizationId: z.number().nullable(),
      userId: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      // Hole aktuelles Template
      const [current] = await db
        .select()
        .from(customSuperprompts)
        .where(eq(customSuperprompts.id, input.id))
        .limit(1);

      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Custom-Template nicht gefunden" });
      }

      // Hole Kundennummer für neue uniqueId
      let customerNumber = "K2026-000";
      if (input.organizationId) {
        const [org] = await db
          .select({ customerNumber: organizations.customerNumber })
          .from(organizations)
          .where(eq(organizations.id, input.organizationId))
          .limit(1);
        customerNumber = org?.customerNumber || `K2026-${String(input.organizationId).padStart(3, '0')}`;
      }

      // Generiere neue uniqueId
      const baseTemplateNum = String(current.baseTemplateId).padStart(3, '0');
      const newUniqueId = `CT-${baseTemplateNum}-${customerNumber}-V${current.version}`;

      await db
        .update(customSuperprompts)
        .set({
          organizationId: input.organizationId,
          userId: input.userId || null,
          uniqueId: newUniqueId,
        })
        .where(eq(customSuperprompts.id, input.id));

      return { success: true, newUniqueId };
    }),

  // Status ändern (aktiv, pausiert, archiviert)
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "paused", "archived", "change_requested"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      await db
        .update(customSuperprompts)
        .set({
          status: input.status,
          isActive: input.status === "active" ? 1 : 0,
        })
        .where(eq(customSuperprompts.id, input.id));

      return { success: true };
    }),

  // Nutzungsstatistik pro Custom-Template
  getUsageStats: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const { workflowExecutions, workflowFeedback } = await import("../../drizzle/schema");

      // Hole das Custom-Template
      const [template] = await db
        .select()
        .from(customSuperprompts)
        .where(eq(customSuperprompts.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Letzte 10 Ausführungen (basierend auf baseTemplateId und organizationId)
      const recentExecutions = await db
        .select({
          id: workflowExecutions.id,
          status: workflowExecutions.status,
          startedAt: workflowExecutions.startedAt,
          completedAt: workflowExecutions.completedAt,
          userId: workflowExecutions.userId,
        })
        .from(workflowExecutions)
        .where(eq(workflowExecutions.templateId, template.baseTemplateId))
        .orderBy(desc(workflowExecutions.startedAt))
        .limit(10);

      // Durchschnittliche Bewertung
      const feedbacks = await db
        .select({ rating: workflowFeedback.rating })
        .from(workflowFeedback)
        .innerJoin(workflowExecutions, eq(workflowFeedback.executionId, workflowExecutions.id))
        .where(eq(workflowExecutions.templateId, template.baseTemplateId));

      // Rating ist ein String (positive/negative), zähle positive Bewertungen
      const positiveCount = feedbacks.filter(f => f.rating === 'positive').length;
      const avgRating = feedbacks.length > 0
        ? Math.round((positiveCount / feedbacks.length) * 100)
        : null;

      return {
        totalUsage: template.usageCount || 0,
        lastUsedAt: template.lastUsedAt,
        recentExecutions,
        avgRating,
        feedbackCount: feedbacks.length,
      };
    }),

  // Alle Organisationen für Dropdown
  getOrganizationsForAssignment: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "owner") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        customerNumber: organizations.customerNumber,
      })
      .from(organizations)
      .orderBy(organizations.name);

    return orgs;
  }),

  // Alle Owner-Templates für Dropdown
  getOwnerTemplatesForFilter: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "owner") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

    const templates = await db
      .select({
        id: taskTemplates.id,
        name: taskTemplates.name,
        uniqueId: taskTemplates.uniqueId,
      })
      .from(taskTemplates)
      .orderBy(taskTemplates.name);

    return templates;
  }),

  // ==================== ÄNDERUNGSANFRAGE-SYSTEM ====================

  // Kunde: Änderungsanfrage einreichen
  submitChangeRequest: protectedProcedure
    .input(z.object({
      customTemplateId: z.number(),
      title: z.string().min(5, "Überschrift muss mindestens 5 Zeichen haben"),
      description: z.string().min(20, "Beschreibung muss mindestens 20 Zeichen haben"),
      reason: z.string().optional(),
      priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      // Prüfe ob das Custom-Template existiert und dem User/seiner Firma gehört
      const template = await db
        .select()
        .from(customSuperprompts)
        .where(eq(customSuperprompts.id, input.customTemplateId))
        .then(rows => rows[0]);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Custom-Template nicht gefunden" });
      }

      // Nur Owner oder der Besitzer des Templates kann Anfragen stellen
      const isOwner = ctx.user.role === "owner";
      const isTemplateOwner = template.userId === ctx.user.id || 
        (template.organizationId && ctx.user.organizationId === template.organizationId);

      if (!isOwner && !isTemplateOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung für dieses Template" });
      }

      // Anfrage erstellen
      const result = await db.insert(templateChangeRequests).values({
        customTemplateId: input.customTemplateId,
        requestedBy: ctx.user.id,
        organizationId: ctx.user.organizationId,
        title: input.title,
        description: input.description,
        reason: input.reason,
        priority: input.priority,
        status: "open",
      });

      // Status des Custom-Templates auf "change_requested" setzen
      await db
        .update(customSuperprompts)
        .set({ status: "change_requested" })
        .where(eq(customSuperprompts.id, input.customTemplateId));

      return { success: true, requestId: Number((result as any).insertId || 0) };
    }),

  // Admin: Alle Änderungsanfragen laden
  getChangeRequests: protectedProcedure
    .input(z.object({
      status: z.enum(["all", "open", "in_review", "in_progress", "implemented", "rejected", "closed"]).default("all"),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const offset = (input.page - 1) * input.limit;

      // Basis-Query
      let query = db
        .select({
          id: templateChangeRequests.id,
          customTemplateId: templateChangeRequests.customTemplateId,
          title: templateChangeRequests.title,
          description: templateChangeRequests.description,
          reason: templateChangeRequests.reason,
          priority: templateChangeRequests.priority,
          status: templateChangeRequests.status,
          requestedBy: templateChangeRequests.requestedBy,
          organizationId: templateChangeRequests.organizationId,
          assignedTo: templateChangeRequests.assignedTo,
          reviewNote: templateChangeRequests.reviewNote,
          createdAt: templateChangeRequests.createdAt,
          updatedAt: templateChangeRequests.updatedAt,
          // Joins
          templateName: customSuperprompts.name,
          templateUniqueId: customSuperprompts.uniqueId,
          requesterName: users.name,
          organizationName: organizations.name,
        })
        .from(templateChangeRequests)
        .leftJoin(customSuperprompts, eq(templateChangeRequests.customTemplateId, customSuperprompts.id))
        .leftJoin(users, eq(templateChangeRequests.requestedBy, users.id))
        .leftJoin(organizations, eq(templateChangeRequests.organizationId, organizations.id))
        .orderBy(desc(templateChangeRequests.createdAt))
        .limit(input.limit)
        .offset(offset);

      const requests = await query;

      // Filter nach Status
      const filtered = input.status === "all" 
        ? requests 
        : requests.filter(r => r.status === input.status);

      // Statistiken
      const allRequests = await db.select({ status: templateChangeRequests.status }).from(templateChangeRequests);
      const stats = {
        total: allRequests.length,
        open: allRequests.filter(r => r.status === "open").length,
        inReview: allRequests.filter(r => r.status === "in_review").length,
        inProgress: allRequests.filter(r => r.status === "in_progress").length,
        implemented: allRequests.filter(r => r.status === "implemented").length,
        rejected: allRequests.filter(r => r.status === "rejected").length,
      };

      return { requests: filtered, stats };
    }),

  // Admin: Änderungsanfrage bearbeiten
  processChangeRequest: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["open", "in_review", "in_progress", "implemented", "rejected", "closed"]),
      reviewNote: z.string().optional(),
      assignedTo: z.number().optional(),
      // Wenn umgesetzt: Neuer Superprompt
      newSuperprompt: z.string().optional(),
      // Wenn revolutionär: Auch Owner-Template aktualisieren
      updateOwnerTemplate: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      // Anfrage laden
      const request = await db
        .select()
        .from(templateChangeRequests)
        .where(eq(templateChangeRequests.id, input.id))
        .then(rows => rows[0]);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Anfrage nicht gefunden" });
      }

      // Anfrage aktualisieren
      await db
        .update(templateChangeRequests)
        .set({
          status: input.status,
          reviewNote: input.reviewNote,
          assignedTo: input.assignedTo,
          completedAt: input.status === "implemented" || input.status === "rejected" || input.status === "closed" 
            ? new Date() 
            : null,
        })
        .where(eq(templateChangeRequests.id, input.id));

      // Wenn umgesetzt und neuer Superprompt vorhanden
      if (input.status === "implemented" && input.newSuperprompt) {
        // Custom-Template aktualisieren
        const customTemplate = await db
          .select()
          .from(customSuperprompts)
          .where(eq(customSuperprompts.id, request.customTemplateId))
          .then(rows => rows[0]);

        if (customTemplate) {
          // Alte Version in History speichern
          await db.insert(customSuperpromptHistory).values({
            customSuperpromptId: customTemplate.id,
            superprompt: customTemplate.superprompt || "",
            version: customTemplate.version,
            changeDescription: `Änderungsanfrage #${input.id} umgesetzt`,
            changedBy: ctx.user.id,
          });

          // Neue Version speichern
          await db
            .update(customSuperprompts)
            .set({
              superprompt: input.newSuperprompt,
              version: customTemplate.version + 1,
              status: "active",
            })
            .where(eq(customSuperprompts.id, customTemplate.id));

          // Wenn revolutionär: Auch Owner-Template aktualisieren
          if (input.updateOwnerTemplate && customTemplate.baseTemplateId) {
            await db
              .update(taskTemplates)
              .set({
                superprompt: input.newSuperprompt,
              })
              .where(eq(taskTemplates.id, customTemplate.baseTemplateId));
          }
        }
      }

      // Wenn abgelehnt oder geschlossen: Custom-Template Status zurücksetzen
      if (input.status === "rejected" || input.status === "closed") {
        await db
          .update(customSuperprompts)
          .set({ status: "active" })
          .where(eq(customSuperprompts.id, request.customTemplateId));
      }

      return { success: true };
    }),

  // Kunde: Meine Änderungsanfragen
  getMyChangeRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

    const requests = await db
      .select({
        id: templateChangeRequests.id,
        title: templateChangeRequests.title,
        description: templateChangeRequests.description,
        status: templateChangeRequests.status,
        priority: templateChangeRequests.priority,
        createdAt: templateChangeRequests.createdAt,
        completedAt: templateChangeRequests.completedAt,
        templateName: customSuperprompts.name,
        templateUniqueId: customSuperprompts.uniqueId,
      })
      .from(templateChangeRequests)
      .leftJoin(customSuperprompts, eq(templateChangeRequests.customTemplateId, customSuperprompts.id))
      .where(eq(templateChangeRequests.requestedBy, ctx.user.id))
      .orderBy(desc(templateChangeRequests.createdAt));

    return requests;
  }),
});
