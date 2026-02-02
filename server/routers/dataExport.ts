import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  taskTemplates, 
  categories, 
  businessAreas, 
  metapromptTemplates,
  superpromptVersions 
} from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Export-Format für Templates
const exportedTemplateSchema = z.object({
  slug: z.string(),
  name: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  shortDescription: z.string().nullable(),
  categorySlug: z.string().nullable(), // Referenz über Slug statt ID
  businessAreaSlug: z.string().nullable(), // Referenz über Slug statt ID
  icon: z.string().nullable(),
  color: z.string().nullable(),
  variableSchema: z.any().nullable(),
  superprompt: z.string().nullable(),
  superpromptVersion: z.number().nullable(),
  estimatedTimeSavings: z.number().nullable(),
  creditCost: z.number().nullable(),
  llmModel: z.string().nullable(),
  llmTemperature: z.string().nullable(),
  maxTokens: z.number().nullable(),
  outputFormat: z.string().nullable(),
  exampleOutput: z.string().nullable(),
  documentRequired: z.number().nullable(),
  documentCount: z.number().nullable(),
  allowedFileTypes: z.any().nullable(),
  maxFileSize: z.number().nullable(),
  maxPages: z.number().nullable(),
  documentRelevanceCheck: z.number().nullable(),
  documentDescription: z.string().nullable(),
  maskingRequired: z.number().nullable(),
  maskingTypes: z.any().nullable(),
  autoMasking: z.number().nullable(),
  keywords: z.any().nullable(),
  status: z.string().nullable(),
  displayOrder: z.number().nullable(),
  isFeatured: z.number().nullable(),
  isPublic: z.number().nullable(),
  uniqueId: z.string().nullable(),
  creationMethod: z.string().nullable(),
  createdByName: z.string().nullable(),
  templateVersion: z.string().nullable(),
  changeLog: z.string().nullable(),
  roiBaseTimeMinutes: z.number().nullable(),
  roiTimePerDocumentMinutes: z.number().nullable(),
  roiKi2goTimeMinutes: z.number().nullable(),
  roiKi2goTimePerDocument: z.number().nullable(),
  roiHourlyRate: z.number().nullable(),
  roiTasksPerMonth: z.number().nullable(),
  roiSources: z.any().nullable(),
  marketingEnabled: z.number().nullable(),
  marketingHeadline: z.string().nullable(),
  marketingSubheadline: z.string().nullable(),
  marketingUsps: z.any().nullable(),
  marketingCtaText: z.string().nullable(),
  marketingMetaDescription: z.string().nullable(),
  marketingKeywords: z.any().nullable(),
  disclaimer: z.string().nullable(),
});

// Export-Format für das gesamte Paket
const exportPackageSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  exportedBy: z.string().nullable(),
  categories: z.array(z.object({
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    icon: z.string().nullable(),
    color: z.string().nullable(),
    displayOrder: z.number().nullable(),
    isActive: z.number().nullable(),
  })),
  businessAreas: z.array(z.object({
    slug: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    icon: z.string().nullable(),
    displayOrder: z.number().nullable(),
    isActive: z.number().nullable(),
  })),
  metaprompts: z.array(z.object({
    name: z.string(),
    description: z.string().nullable(),
    template: z.string(),
    version: z.number().nullable(),
    isActive: z.number().nullable(),
    isDefault: z.number().nullable(),
    targetAudience: z.string().nullable(),
    outputStyle: z.string().nullable(),
    createdByName: z.string().nullable(),
    versionLabel: z.string().nullable(),
    changeLog: z.string().nullable(),
  })),
  templates: z.array(exportedTemplateSchema),
});

export const dataExportRouter = router({
  // Alle Daten exportieren (nur Owner)
  exportAll: protectedProcedure
    .query(async ({ ctx }) => {
      // Nur Owner darf exportieren
      if (ctx.user.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nur der Owner kann Daten exportieren",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Kategorien laden
      const allCategories = await db.select().from(categories);
      
      // Business Areas laden
      const allBusinessAreas = await db.select().from(businessAreas);
      
      // Metaprompts laden
      const allMetaprompts = await db.select().from(metapromptTemplates);
      
      // Templates laden mit Kategorie- und BusinessArea-Slugs
      const allTemplates = await db.select({
        template: taskTemplates,
        categorySlug: categories.slug,
        businessAreaSlug: businessAreas.slug,
      })
      .from(taskTemplates)
      .leftJoin(categories, eq(taskTemplates.categoryId, categories.id))
      .leftJoin(businessAreas, eq(taskTemplates.businessAreaId, businessAreas.id));

      // Export-Paket erstellen
      const exportPackage = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        exportedBy: ctx.user.name || ctx.user.openId,
        categories: allCategories.map((c: any) => ({
          slug: c.slug,
          name: c.name,
          description: c.description,
          icon: c.icon,
          color: c.color,
          displayOrder: c.displayOrder,
          isActive: c.isActive,
        })),
        businessAreas: allBusinessAreas.map((b: any) => ({
          slug: b.slug,
          name: b.name,
          description: b.description,
          icon: b.icon,
          displayOrder: b.displayOrder,
          isActive: b.isActive,
        })),
        metaprompts: allMetaprompts.map((m: any) => ({
          name: m.name,
          description: m.description,
          template: m.template,
          version: m.version,
          isActive: m.isActive,
          isDefault: m.isDefault,
          targetAudience: m.targetAudience,
          outputStyle: m.outputStyle,
          createdByName: m.createdByName,
          versionLabel: m.versionLabel,
          changeLog: m.changeLog,
        })),
        templates: allTemplates.map(({ template: t, categorySlug, businessAreaSlug }: { template: any; categorySlug: string | null; businessAreaSlug: string | null }) => ({
          slug: t.slug,
          name: t.name,
          title: t.title,
          description: t.description,
          shortDescription: t.shortDescription,
          categorySlug,
          businessAreaSlug,
          icon: t.icon,
          color: t.color,
          variableSchema: t.variableSchema,
          superprompt: t.superprompt,
          superpromptVersion: t.superpromptVersion,
          estimatedTimeSavings: t.estimatedTimeSavings,
          creditCost: t.creditCost,
          llmModel: t.llmModel,
          llmTemperature: t.llmTemperature,
          maxTokens: t.maxTokens,
          outputFormat: t.outputFormat,
          exampleOutput: t.exampleOutput,
          documentRequired: t.documentRequired,
          documentCount: t.documentCount,
          allowedFileTypes: t.allowedFileTypes,
          maxFileSize: t.maxFileSize,
          maxPages: t.maxPages,
          documentRelevanceCheck: t.documentRelevanceCheck,
          documentDescription: t.documentDescription,
          maskingRequired: t.maskingRequired,
          maskingTypes: t.maskingTypes,
          autoMasking: t.autoMasking,
          keywords: t.keywords,
          status: t.status,
          displayOrder: t.displayOrder,
          isFeatured: t.isFeatured,
          isPublic: t.isPublic,
          uniqueId: t.uniqueId,
          creationMethod: t.creationMethod,
          createdByName: t.createdByName,
          templateVersion: t.templateVersion,
          changeLog: t.changeLog,
          roiBaseTimeMinutes: t.roiBaseTimeMinutes,
          roiTimePerDocumentMinutes: t.roiTimePerDocumentMinutes,
          roiKi2goTimeMinutes: t.roiKi2goTimeMinutes,
          roiKi2goTimePerDocument: t.roiKi2goTimePerDocument,
          roiHourlyRate: t.roiHourlyRate,
          roiTasksPerMonth: t.roiTasksPerMonth,
          roiSources: t.roiSources,
          marketingEnabled: t.marketingEnabled,
          marketingHeadline: t.marketingHeadline,
          marketingSubheadline: t.marketingSubheadline,
          marketingUsps: t.marketingUsps,
          marketingCtaText: t.marketingCtaText,
          marketingMetaDescription: t.marketingMetaDescription,
          marketingKeywords: t.marketingKeywords,
          disclaimer: t.disclaimer,
        })),
      };

      return exportPackage;
    }),

  // Nur Templates exportieren (nur Owner)
  exportTemplates: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nur der Owner kann Templates exportieren",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const allTemplates = await db.select({
        template: taskTemplates,
        categorySlug: categories.slug,
        businessAreaSlug: businessAreas.slug,
      })
      .from(taskTemplates)
      .leftJoin(categories, eq(taskTemplates.categoryId, categories.id))
      .leftJoin(businessAreas, eq(taskTemplates.businessAreaId, businessAreas.id));

      return {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        exportedBy: ctx.user.name || ctx.user.openId,
        templateCount: allTemplates.length,
        templates: allTemplates.map(({ template: t, categorySlug, businessAreaSlug }: { template: any; categorySlug: string | null; businessAreaSlug: string | null }) => ({
          slug: t.slug,
          name: t.name,
          title: t.title,
          description: t.description,
          shortDescription: t.shortDescription,
          categorySlug,
          businessAreaSlug,
          icon: t.icon,
          color: t.color,
          variableSchema: t.variableSchema,
          superprompt: t.superprompt,
          superpromptVersion: t.superpromptVersion,
          estimatedTimeSavings: t.estimatedTimeSavings,
          creditCost: t.creditCost,
          llmModel: t.llmModel,
          llmTemperature: t.llmTemperature,
          maxTokens: t.maxTokens,
          outputFormat: t.outputFormat,
          exampleOutput: t.exampleOutput,
          documentRequired: t.documentRequired,
          documentCount: t.documentCount,
          allowedFileTypes: t.allowedFileTypes,
          maxFileSize: t.maxFileSize,
          maxPages: t.maxPages,
          documentRelevanceCheck: t.documentRelevanceCheck,
          documentDescription: t.documentDescription,
          maskingRequired: t.maskingRequired,
          maskingTypes: t.maskingTypes,
          autoMasking: t.autoMasking,
          keywords: t.keywords,
          status: t.status,
          displayOrder: t.displayOrder,
          isFeatured: t.isFeatured,
          isPublic: t.isPublic,
          uniqueId: t.uniqueId,
          creationMethod: t.creationMethod,
          createdByName: t.createdByName,
          templateVersion: t.templateVersion,
          changeLog: t.changeLog,
          roiBaseTimeMinutes: t.roiBaseTimeMinutes,
          roiTimePerDocumentMinutes: t.roiTimePerDocumentMinutes,
          roiKi2goTimeMinutes: t.roiKi2goTimeMinutes,
          roiKi2goTimePerDocument: t.roiKi2goTimePerDocument,
          roiHourlyRate: t.roiHourlyRate,
          roiTasksPerMonth: t.roiTasksPerMonth,
          roiSources: t.roiSources,
          marketingEnabled: t.marketingEnabled,
          marketingHeadline: t.marketingHeadline,
          marketingSubheadline: t.marketingSubheadline,
          marketingUsps: t.marketingUsps,
          marketingCtaText: t.marketingCtaText,
          marketingMetaDescription: t.marketingMetaDescription,
          marketingKeywords: t.marketingKeywords,
          disclaimer: t.disclaimer,
        })),
      };
    }),

  // Daten importieren (nur Owner)
  importAll: protectedProcedure
    .input(z.object({
      data: exportPackageSchema,
      options: z.object({
        skipExisting: z.boolean().default(true), // Bestehende überspringen
        updateExisting: z.boolean().default(false), // Bestehende aktualisieren
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nur der Owner kann Daten importieren",
        });
      }

      const { data, options = { skipExisting: true, updateExisting: false } } = input;

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const results = {
        categories: { created: 0, skipped: 0, updated: 0 },
        businessAreas: { created: 0, skipped: 0, updated: 0 },
        metaprompts: { created: 0, skipped: 0, updated: 0 },
        templates: { created: 0, skipped: 0, updated: 0, errors: [] as string[] },
      };

      // 1. Kategorien importieren
      for (const cat of data.categories) {
        const existing = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
        
        if (existing.length > 0) {
          if (options.updateExisting) {
            await db.update(categories)
              .set({
                name: cat.name,
                description: cat.description,
                icon: cat.icon,
                color: cat.color,
                displayOrder: cat.displayOrder,
                isActive: cat.isActive,
              })
              .where(eq(categories.slug, cat.slug));
            results.categories.updated++;
          } else {
            results.categories.skipped++;
          }
        } else {
          await db.insert(categories).values({
            slug: cat.slug,
            name: cat.name,
            description: cat.description,
            icon: cat.icon,
            color: cat.color,
            displayOrder: cat.displayOrder ?? 0,
            isActive: cat.isActive ?? 1,
            createdBy: ctx.user.id,
          });
          results.categories.created++;
        }
      }

      // 2. Business Areas importieren
      for (const ba of data.businessAreas) {
        const existing = await db.select().from(businessAreas).where(eq(businessAreas.slug, ba.slug)).limit(1);
        
        if (existing.length > 0) {
          if (options.updateExisting) {
            await db.update(businessAreas)
              .set({
                name: ba.name,
                description: ba.description,
                icon: ba.icon,
                displayOrder: ba.displayOrder,
                isActive: ba.isActive,
              })
              .where(eq(businessAreas.slug, ba.slug));
            results.businessAreas.updated++;
          } else {
            results.businessAreas.skipped++;
          }
        } else {
          await db.insert(businessAreas).values({
            slug: ba.slug,
            name: ba.name,
            description: ba.description,
            icon: ba.icon,
            displayOrder: ba.displayOrder ?? 0,
            isActive: ba.isActive ?? 1,
            createdBy: ctx.user.id,
          });
          results.businessAreas.created++;
        }
      }

      // 3. Metaprompts importieren
      for (const mp of data.metaprompts) {
        const existing = await db.select().from(metapromptTemplates).where(eq(metapromptTemplates.name, mp.name)).limit(1);
        
        if (existing.length > 0) {
          if (options.updateExisting) {
            await db.update(metapromptTemplates)
              .set({
                description: mp.description,
                template: mp.template,
                version: mp.version,
                isActive: mp.isActive,
                isDefault: mp.isDefault,
                targetAudience: mp.targetAudience,
                outputStyle: mp.outputStyle,
                createdByName: mp.createdByName,
                versionLabel: mp.versionLabel,
                changeLog: mp.changeLog,
              })
              .where(eq(metapromptTemplates.name, mp.name));
            results.metaprompts.updated++;
          } else {
            results.metaprompts.skipped++;
          }
        } else {
          await db.insert(metapromptTemplates).values({
            name: mp.name,
            description: mp.description,
            template: mp.template,
            version: mp.version ?? 1,
            isActive: mp.isActive ?? 1,
            isDefault: mp.isDefault ?? 0,
            targetAudience: mp.targetAudience,
            outputStyle: mp.outputStyle,
            createdByName: mp.createdByName,
            versionLabel: mp.versionLabel,
            changeLog: mp.changeLog,
            createdBy: ctx.user.id,
          });
          results.metaprompts.created++;
        }
      }

      // 4. Templates importieren
      // Zuerst Kategorie- und BusinessArea-IDs laden
      const categoryMap = new Map<string, number>();
      const businessAreaMap = new Map<string, number>();
      
      const allCats = await db.select().from(categories);
      allCats.forEach((c: { slug: string; id: number }) => categoryMap.set(c.slug, c.id));
      
      const allBAs = await db.select().from(businessAreas);
      allBAs.forEach((b: { slug: string; id: number }) => businessAreaMap.set(b.slug, b.id));

      for (const tpl of data.templates) {
        try {
          const existing = await db.select().from(taskTemplates).where(eq(taskTemplates.slug, tpl.slug)).limit(1);
          
          // Kategorie- und BusinessArea-IDs auflösen
          const categoryId = tpl.categorySlug ? categoryMap.get(tpl.categorySlug) : null;
          const businessAreaId = tpl.businessAreaSlug ? businessAreaMap.get(tpl.businessAreaSlug) : null;

          if (existing.length > 0) {
            if (options.updateExisting) {
              await db.update(taskTemplates)
                .set({
                  name: tpl.name,
                  title: tpl.title,
                  description: tpl.description,
                  shortDescription: tpl.shortDescription,
                  categoryId,
                  businessAreaId,
                  icon: tpl.icon,
                  color: tpl.color,
                  variableSchema: tpl.variableSchema,
                  superprompt: tpl.superprompt,
                  superpromptVersion: tpl.superpromptVersion,
                  estimatedTimeSavings: tpl.estimatedTimeSavings,
                  creditCost: tpl.creditCost,
                  llmModel: tpl.llmModel,
                  llmTemperature: tpl.llmTemperature,
                  maxTokens: tpl.maxTokens,
                  outputFormat: tpl.outputFormat as any,
                  exampleOutput: tpl.exampleOutput,
                  documentRequired: tpl.documentRequired,
                  documentCount: tpl.documentCount,
                  allowedFileTypes: tpl.allowedFileTypes,
                  maxFileSize: tpl.maxFileSize,
                  maxPages: tpl.maxPages,
                  documentRelevanceCheck: tpl.documentRelevanceCheck,
                  documentDescription: tpl.documentDescription,
                  maskingRequired: tpl.maskingRequired,
                  maskingTypes: tpl.maskingTypes,
                  autoMasking: tpl.autoMasking,
                  keywords: tpl.keywords,
                  status: tpl.status as any,
                  displayOrder: tpl.displayOrder,
                  isFeatured: tpl.isFeatured,
                  isPublic: tpl.isPublic,
                  createdByName: tpl.createdByName,
                  templateVersion: tpl.templateVersion,
                  changeLog: tpl.changeLog,
                  roiBaseTimeMinutes: tpl.roiBaseTimeMinutes,
                  roiTimePerDocumentMinutes: tpl.roiTimePerDocumentMinutes,
                  roiKi2goTimeMinutes: tpl.roiKi2goTimeMinutes,
                  roiKi2goTimePerDocument: tpl.roiKi2goTimePerDocument,
                  roiHourlyRate: tpl.roiHourlyRate,
                  roiTasksPerMonth: tpl.roiTasksPerMonth,
                  roiSources: tpl.roiSources,
                  marketingEnabled: tpl.marketingEnabled,
                  marketingHeadline: tpl.marketingHeadline,
                  marketingSubheadline: tpl.marketingSubheadline,
                  marketingUsps: tpl.marketingUsps,
                  marketingCtaText: tpl.marketingCtaText,
                  marketingMetaDescription: tpl.marketingMetaDescription,
                  marketingKeywords: tpl.marketingKeywords,
                  disclaimer: tpl.disclaimer,
                  updatedBy: ctx.user.id,
                })
                .where(eq(taskTemplates.slug, tpl.slug));
              results.templates.updated++;
            } else {
              results.templates.skipped++;
            }
          } else {
            await db.insert(taskTemplates).values({
              slug: tpl.slug,
              name: tpl.name,
              title: tpl.title,
              description: tpl.description,
              shortDescription: tpl.shortDescription,
              categoryId,
              businessAreaId,
              icon: tpl.icon,
              color: tpl.color,
              variableSchema: tpl.variableSchema,
              superprompt: tpl.superprompt,
              superpromptVersion: tpl.superpromptVersion ?? 1,
              estimatedTimeSavings: tpl.estimatedTimeSavings,
              creditCost: tpl.creditCost ?? 1,
              llmModel: tpl.llmModel,
              llmTemperature: tpl.llmTemperature,
              maxTokens: tpl.maxTokens,
              outputFormat: (tpl.outputFormat as any) ?? "markdown",
              exampleOutput: tpl.exampleOutput,
              documentRequired: tpl.documentRequired ?? 0,
              documentCount: tpl.documentCount ?? 1,
              allowedFileTypes: tpl.allowedFileTypes,
              maxFileSize: tpl.maxFileSize ?? 10485760,
              maxPages: tpl.maxPages,
              documentRelevanceCheck: tpl.documentRelevanceCheck ?? 0,
              documentDescription: tpl.documentDescription,
              maskingRequired: tpl.maskingRequired ?? 0,
              maskingTypes: tpl.maskingTypes,
              autoMasking: tpl.autoMasking ?? 0,
              keywords: tpl.keywords,
              status: (tpl.status as any) ?? "draft",
              displayOrder: tpl.displayOrder ?? 0,
              isFeatured: tpl.isFeatured ?? 0,
              isPublic: tpl.isPublic ?? 0,
              uniqueId: tpl.uniqueId,
              creationMethod: (tpl.creationMethod as any) ?? "import",
              createdByName: tpl.createdByName,
              templateVersion: tpl.templateVersion ?? "1.0",
              changeLog: tpl.changeLog,
              roiBaseTimeMinutes: tpl.roiBaseTimeMinutes ?? 30,
              roiTimePerDocumentMinutes: tpl.roiTimePerDocumentMinutes ?? 15,
              roiKi2goTimeMinutes: tpl.roiKi2goTimeMinutes ?? 3,
              roiKi2goTimePerDocument: tpl.roiKi2goTimePerDocument ?? 1,
              roiHourlyRate: tpl.roiHourlyRate ?? 80,
              roiTasksPerMonth: tpl.roiTasksPerMonth ?? 10,
              roiSources: tpl.roiSources,
              marketingEnabled: tpl.marketingEnabled ?? 0,
              marketingHeadline: tpl.marketingHeadline,
              marketingSubheadline: tpl.marketingSubheadline,
              marketingUsps: tpl.marketingUsps,
              marketingCtaText: tpl.marketingCtaText,
              marketingMetaDescription: tpl.marketingMetaDescription,
              marketingKeywords: tpl.marketingKeywords,
              disclaimer: tpl.disclaimer,
              createdBy: ctx.user.id,
            });
            results.templates.created++;
          }
        } catch (error: any) {
          results.templates.errors.push(`${tpl.slug}: ${error.message}`);
        }
      }

      return {
        success: true,
        results,
        summary: {
          totalCategories: results.categories.created + results.categories.updated,
          totalBusinessAreas: results.businessAreas.created + results.businessAreas.updated,
          totalMetaprompts: results.metaprompts.created + results.metaprompts.updated,
          totalTemplates: results.templates.created + results.templates.updated,
          errors: results.templates.errors.length,
        },
      };
    }),

  // Export-Statistiken abrufen (für UI)
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nur der Owner kann Export-Statistiken abrufen",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
      const [businessAreaCount] = await db.select({ count: sql<number>`count(*)` }).from(businessAreas);
      const [metapromptCount] = await db.select({ count: sql<number>`count(*)` }).from(metapromptTemplates);
      const [templateCount] = await db.select({ count: sql<number>`count(*)` }).from(taskTemplates);

      return {
        categories: categoryCount.count,
        businessAreas: businessAreaCount.count,
        metaprompts: metapromptCount.count,
        templates: templateCount.count,
      };
    }),
});
