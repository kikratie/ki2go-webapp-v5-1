import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  customSuperprompts, 
  taskTemplates, 
  templateCategories, 
  templateCategoryAssignments,
  templateMemberAssignments,
  organizationTemplates,
  taskRequests,
  users,
  organizations
} from "../../drizzle/schema";
import { eq, and, or, desc, sql, isNull } from "drizzle-orm";
import { checkFeature, checkLimit } from "../planFeatures";

export const myTemplatesRouter = router({
  // Alle Custom-Templates des eingeloggten Users laden
  getAll: protectedProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const userId = ctx.user.id;
      const orgId = ctx.user.organizationId;

      // Templates laden die dem User gehören oder ihm zugewiesen wurden
      let templates = await db
        .select({
          id: customSuperprompts.id,
          uniqueId: customSuperprompts.uniqueId,
          baseTemplateId: customSuperprompts.baseTemplateId,
          name: customSuperprompts.name,
          description: customSuperprompts.description,
          isActive: customSuperprompts.isActive,
          status: customSuperprompts.status,
          version: customSuperprompts.version,
          usageCount: customSuperprompts.usageCount,
          lastUsedAt: customSuperprompts.lastUsedAt,
          createdAt: customSuperprompts.createdAt,
          userId: customSuperprompts.userId,
          organizationId: customSuperprompts.organizationId,
        })
        .from(customSuperprompts)
        .where(
          or(
            eq(customSuperprompts.userId, userId),
            orgId ? eq(customSuperprompts.organizationId, orgId) : sql`FALSE`
          )
        )
        .orderBy(desc(customSuperprompts.lastUsedAt));

      // Auch Templates laden die dem User zugewiesen wurden
      const assignedTemplateIds = await db
        .select({ customTemplateId: templateMemberAssignments.customTemplateId })
        .from(templateMemberAssignments)
        .where(eq(templateMemberAssignments.userId, userId));

      if (assignedTemplateIds.length > 0) {
        const assignedIds = assignedTemplateIds.map(a => a.customTemplateId);
        const assignedTemplates = await db
          .select({
            id: customSuperprompts.id,
            uniqueId: customSuperprompts.uniqueId,
            baseTemplateId: customSuperprompts.baseTemplateId,
            name: customSuperprompts.name,
            description: customSuperprompts.description,
            isActive: customSuperprompts.isActive,
            status: customSuperprompts.status,
            version: customSuperprompts.version,
            usageCount: customSuperprompts.usageCount,
            lastUsedAt: customSuperprompts.lastUsedAt,
            createdAt: customSuperprompts.createdAt,
            userId: customSuperprompts.userId,
            organizationId: customSuperprompts.organizationId,
          })
          .from(customSuperprompts)
          .where(sql`${customSuperprompts.id} IN (${assignedIds.join(",")})`);

        // Merge ohne Duplikate
        const existingIds = new Set(templates.map(t => t.id));
        for (const t of assignedTemplates) {
          if (!existingIds.has(t.id)) {
            templates.push(t);
          }
        }
      }

      // Basis-Template Namen laden
      const enrichedTemplates = await Promise.all(templates.map(async (t) => {
        const [baseTemplate] = await db
          .select({ 
            name: taskTemplates.name, 
            title: taskTemplates.title,
            uniqueId: taskTemplates.uniqueId,
            icon: taskTemplates.icon,
            slug: taskTemplates.slug,
          })
          .from(taskTemplates)
          .where(eq(taskTemplates.id, t.baseTemplateId))
          .limit(1);

        // Kategorien laden
        const categories = await db
          .select({ 
            categoryId: templateCategoryAssignments.categoryId,
            categoryName: templateCategories.name,
            categoryColor: templateCategories.color,
          })
          .from(templateCategoryAssignments)
          .leftJoin(templateCategories, eq(templateCategoryAssignments.categoryId, templateCategories.id))
          .where(eq(templateCategoryAssignments.customTemplateId, t.id));

        // Bestimme ob User Owner ist oder nur zugewiesen
        const isOwner = t.userId === userId;
        const isOrgTemplate = t.organizationId === orgId && !t.userId;

        return {
          ...t,
          baseTemplateName: baseTemplate?.name || "Unbekannt",
          baseTemplateTitle: baseTemplate?.title || t.name,
          baseTemplateUniqueId: baseTemplate?.uniqueId || null,
          baseTemplateIcon: baseTemplate?.icon || "FileText",
          baseTemplateSlug: baseTemplate?.slug || null,
          categories: categories.map(c => ({
            id: c.categoryId,
            name: c.categoryName,
            color: c.categoryColor,
          })),
          isOwner,
          isOrgTemplate,
          canManage: isOwner || (ctx.user.role === "admin" && isOrgTemplate),
        };
      }));

      // Filter nach Kategorie
      let filteredTemplates = enrichedTemplates;
      if (input?.categoryId) {
        filteredTemplates = enrichedTemplates.filter(t => 
          t.categories.some(c => c.id === input.categoryId)
        );
      }

      // Suche
      if (input?.search) {
        const searchLower = input.search.toLowerCase();
        filteredTemplates = filteredTemplates.filter(t =>
          t.name.toLowerCase().includes(searchLower) ||
          t.baseTemplateTitle.toLowerCase().includes(searchLower) ||
          (t.description && t.description.toLowerCase().includes(searchLower))
        );
      }

      return {
        templates: filteredTemplates,
        total: filteredTemplates.length,
      };
    }),

  // Eigene Kategorien laden
  getCategories: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const userId = ctx.user.id;
      const orgId = ctx.user.organizationId;

      const categories = await db
        .select()
        .from(templateCategories)
        .where(
          or(
            eq(templateCategories.userId, userId),
            orgId ? eq(templateCategories.organizationId, orgId) : sql`FALSE`
          )
        )
        .orderBy(templateCategories.sortOrder);

      return categories;
    }),

  // Neue Kategorie erstellen
  createCategory: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const userId = ctx.user.id;
      const orgId = ctx.user.organizationId;

      // Slug generieren
      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      const [result] = await db.insert(templateCategories).values({
        userId,
        organizationId: orgId || null,
        name: input.name,
        slug,
        description: input.description || null,
        color: input.color || "#3B82F6",
        icon: input.icon || "Folder",
      });

      return { id: result.insertId, slug };
    }),

  // Kategorie aktualisieren
  updateCategory: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const userId = ctx.user.id;
      const orgId = ctx.user.organizationId;

      // Prüfe ob Kategorie dem User gehört
      const [category] = await db
        .select()
        .from(templateCategories)
        .where(eq(templateCategories.id, input.id))
        .limit(1);

      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kategorie nicht gefunden" });
      }

      if (category.userId !== userId && category.organizationId !== orgId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
      }

      const { id, ...updateData } = input;
      await db
        .update(templateCategories)
        .set(updateData)
        .where(eq(templateCategories.id, id));

      return { success: true };
    }),

  // Kategorie löschen
  deleteCategory: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const userId = ctx.user.id;
      const orgId = ctx.user.organizationId;

      // Prüfe ob Kategorie dem User gehört
      const [category] = await db
        .select()
        .from(templateCategories)
        .where(eq(templateCategories.id, input.id))
        .limit(1);

      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kategorie nicht gefunden" });
      }

      if (category.userId !== userId && category.organizationId !== orgId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
      }

      // Lösche Zuordnungen
      await db
        .delete(templateCategoryAssignments)
        .where(eq(templateCategoryAssignments.categoryId, input.id));

      // Lösche Kategorie
      await db
        .delete(templateCategories)
        .where(eq(templateCategories.id, input.id));

      return { success: true };
    }),

  // Template einer Kategorie zuordnen
  assignToCategory: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      categoryId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const userId = ctx.user.id;
      const orgId = ctx.user.organizationId;

      // Prüfe ob Template dem User gehört
      const [template] = await db
        .select()
        .from(customSuperprompts)
        .where(eq(customSuperprompts.id, input.templateId))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template nicht gefunden" });
      }

      if (template.userId !== userId && template.organizationId !== orgId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
      }

      // Prüfe ob Kategorie dem User gehört
      const [category] = await db
        .select()
        .from(templateCategories)
        .where(eq(templateCategories.id, input.categoryId))
        .limit(1);

      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kategorie nicht gefunden" });
      }

      if (category.userId !== userId && category.organizationId !== orgId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung für diese Kategorie" });
      }

      // Prüfe ob bereits zugeordnet
      const [existing] = await db
        .select()
        .from(templateCategoryAssignments)
        .where(and(
          eq(templateCategoryAssignments.customTemplateId, input.templateId),
          eq(templateCategoryAssignments.categoryId, input.categoryId)
        ))
        .limit(1);

      if (existing) {
        return { success: true, message: "Bereits zugeordnet" };
      }

      await db.insert(templateCategoryAssignments).values({
        customTemplateId: input.templateId,
        categoryId: input.categoryId,
      });

      return { success: true };
    }),

  // Template aus Kategorie entfernen
  removeFromCategory: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      categoryId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      await db
        .delete(templateCategoryAssignments)
        .where(and(
          eq(templateCategoryAssignments.customTemplateId, input.templateId),
          eq(templateCategoryAssignments.categoryId, input.categoryId)
        ));

      return { success: true };
    }),

  // Template einem Mitarbeiter zuweisen
  assignToMember: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      memberId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      // Prüfe Feature
      const canShare = await checkFeature(ctx.user.id, "template_sharing");
      if (!canShare) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Template-Freigabe ist in Ihrem Plan nicht enthalten. Bitte upgraden Sie." 
        });
      }

      const userId = ctx.user.id;
      const orgId = ctx.user.organizationId;

      // Prüfe ob Template dem User/Org gehört
      const [template] = await db
        .select()
        .from(customSuperprompts)
        .where(eq(customSuperprompts.id, input.templateId))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template nicht gefunden" });
      }

      // Nur Owner oder Org-Admin kann freigeben
      const isOwner = template.userId === userId;
      const isOrgAdmin = ctx.user.role === "admin" && template.organizationId === orgId;

      if (!isOwner && !isOrgAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung zur Freigabe" });
      }

      // Prüfe ob Mitarbeiter in der gleichen Organisation ist
      const [member] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.memberId))
        .limit(1);

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mitarbeiter nicht gefunden" });
      }

      if (orgId && member.organizationId !== orgId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Mitarbeiter ist nicht in Ihrer Organisation" });
      }

      // Prüfe ob bereits zugewiesen
      const [existing] = await db
        .select()
        .from(templateMemberAssignments)
        .where(and(
          eq(templateMemberAssignments.customTemplateId, input.templateId),
          eq(templateMemberAssignments.userId, input.memberId)
        ))
        .limit(1);

      if (existing) {
        return { success: true, message: "Bereits zugewiesen" };
      }

      await db.insert(templateMemberAssignments).values({
        customTemplateId: input.templateId,
        userId: input.memberId,
        assignedBy: userId,
      });

      return { success: true };
    }),

  // Mitarbeiter-Zuweisung entfernen
  removeFromMember: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      memberId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      await db
        .delete(templateMemberAssignments)
        .where(and(
          eq(templateMemberAssignments.customTemplateId, input.templateId),
          eq(templateMemberAssignments.userId, input.memberId)
        ));

      return { success: true };
    }),

  // Mitarbeiter eines Templates laden
  getTemplateMembers: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const members = await db
        .select({
          id: templateMemberAssignments.id,
          userId: templateMemberAssignments.userId,
          userName: users.name,
          userEmail: users.email,
          canUse: templateMemberAssignments.canUse,
          canView: templateMemberAssignments.canView,
          assignedAt: templateMemberAssignments.createdAt,
        })
        .from(templateMemberAssignments)
        .leftJoin(users, eq(templateMemberAssignments.userId, users.id))
        .where(eq(templateMemberAssignments.customTemplateId, input.templateId));

      return members;
    }),

  // Verfügbare Mitarbeiter für Zuweisung laden (gleiche Organisation)
  getAvailableMembers: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const orgId = ctx.user.organizationId;
      if (!orgId) {
        return [];
      }

      const members = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(and(
          eq(users.organizationId, orgId),
          eq(users.status, "active")
        ));

      // Aktuellen User ausschließen
      return members.filter(m => m.id !== ctx.user.id);
    }),

  // Plan und Usage des Users laden
  getPlanInfo: protectedProcedure
    .query(async ({ ctx }) => {
      const { getUserPlan, getUserUsage, checkLimit } = await import("../planFeatures");
      
      const plan = await getUserPlan(ctx.user.id);
      const usage = await getUserUsage(ctx.user.id);
      const taskLimit = await checkLimit(ctx.user.id, "tasks");
      const templateLimit = await checkLimit(ctx.user.id, "customTemplates");

      return {
        plan,
        usage,
        limits: {
          tasks: taskLimit,
          customTemplates: templateLimit,
        },
      };
    }),

  // "Neue Aufgaben entdecken" - Öffentliche Templates die der User noch nicht verwendet hat
  getDiscoverableTemplates: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).optional().default(12),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const userId = ctx.user.id;
      const orgId = ctx.user.organizationId;
      const limit = input?.limit || 12;

      // Finde alle Template-IDs die der User bereits als Custom-Template hat
      const usedTemplates = await db
        .select({ baseTemplateId: customSuperprompts.baseTemplateId })
        .from(customSuperprompts)
        .where(
          or(
            eq(customSuperprompts.userId, userId),
            orgId ? eq(customSuperprompts.organizationId, orgId) : sql`FALSE`
          )
        );

      const usedTemplateIds = new Set(usedTemplates.map(t => t.baseTemplateId));

      // Lade öffentliche Templates die noch nicht verwendet wurden
      const allPublicTemplates = await db
        .select({
          id: taskTemplates.id,
          uniqueId: taskTemplates.uniqueId,
          slug: taskTemplates.slug,
          name: taskTemplates.name,
          title: taskTemplates.title,
          description: taskTemplates.description,
          shortDescription: taskTemplates.shortDescription,
          icon: taskTemplates.icon,
          color: taskTemplates.color,
          categoryId: taskTemplates.categoryId,
          businessAreaId: taskTemplates.businessAreaId,
          estimatedTimeSavings: taskTemplates.estimatedTimeSavings,
          documentRequired: taskTemplates.documentRequired,
          isPublic: taskTemplates.isPublic,
        })
        .from(taskTemplates)
        .where(eq(taskTemplates.isPublic, 1))
        .orderBy(desc(taskTemplates.usageCount));

      // Filtere verwendete Templates heraus
      const discoverableTemplates = allPublicTemplates
        .filter(t => !usedTemplateIds.has(t.id))
        .slice(0, limit);

      return discoverableTemplates;
    }),

  // Template in den Kundenraum kopieren (für Datenraum-Kunden)
  copyTemplateToKundenraum: protectedProcedure
    .input(z.object({
      templateId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const userId = ctx.user.id;
      const orgId = ctx.user.organizationId;

      // Prüfe ob User einen Datenraum (Organization) hat
      if (!orgId) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Sie benötigen einen Kundenraum um Aufgaben hinzuzufügen. Bitte vervollständigen Sie Ihre Registrierung." 
        });
      }

      // Lade das öffentliche Template
      const [template] = await db
        .select()
        .from(taskTemplates)
        .where(and(
          eq(taskTemplates.id, input.templateId),
          eq(taskTemplates.isPublic, 1)
        ))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aufgabe nicht gefunden oder nicht öffentlich" });
      }

      // Prüfe ob Template bereits im Kundenraum existiert (organizationTemplates)
      const [existingOrgTemplate] = await db
        .select()
        .from(organizationTemplates)
        .where(and(
          eq(organizationTemplates.organizationId, orgId),
          eq(organizationTemplates.templateId, input.templateId)
        ))
        .limit(1);

      if (existingOrgTemplate) {
        return { 
          success: true, 
          alreadyExists: true,
          message: "Diese Aufgabe ist bereits in Ihrem Kundenraum" 
        };
      }

      // Füge Template zum Kundenraum hinzu
      const [result] = await db.insert(organizationTemplates).values({
        organizationId: orgId,
        templateId: input.templateId,
        isActive: 1,
        assignedBy: userId,
      });

      return { 
        success: true, 
        alreadyExists: false,
        id: result.insertId,
        message: `"${template.title}" wurde zu Ihrem Kundenraum hinzugefügt` 
      };
    }),

  // Prüfen ob User einen Datenraum hat
  hasKundenraum: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        hasKundenraum: ctx.user.organizationId !== null && ctx.user.organizationId !== undefined,
        organizationId: ctx.user.organizationId || null,
      };
    }),

  // Templates im Kundenraum laden (aus organizationTemplates)
  getKundenraumTemplates: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const orgId = ctx.user.organizationId;
      if (!orgId) {
        return [];
      }

      // Lade alle Templates die dem Kundenraum zugewiesen sind
      const templates = await db
        .select({
          id: organizationTemplates.id,
          templateId: organizationTemplates.templateId,
          isActive: organizationTemplates.isActive,
          assignedAt: organizationTemplates.assignedAt,
          // Template-Details
          title: taskTemplates.title,
          slug: taskTemplates.slug,
          description: taskTemplates.description,
          shortDescription: taskTemplates.shortDescription,
          icon: taskTemplates.icon,
          color: taskTemplates.color,
          estimatedTimeSavings: taskTemplates.estimatedTimeSavings,
          documentRequired: taskTemplates.documentRequired,
        })
        .from(organizationTemplates)
        .leftJoin(taskTemplates, eq(organizationTemplates.templateId, taskTemplates.id))
        .where(and(
          eq(organizationTemplates.organizationId, orgId),
          eq(organizationTemplates.isActive, 1)
        ))
        .orderBy(desc(organizationTemplates.assignedAt));

      return templates;
    }),

  // Template aus Kundenraum entfernen
  removeFromKundenraum: protectedProcedure
    .input(z.object({
      templateId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const orgId = ctx.user.organizationId;
      if (!orgId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Kein Kundenraum vorhanden" });
      }

      // Deaktiviere das Template (soft delete)
      await db
        .update(organizationTemplates)
        .set({ isActive: 0 })
        .where(and(
          eq(organizationTemplates.organizationId, orgId),
          eq(organizationTemplates.templateId, input.templateId)
        ));

      return { success: true };
    }),

  // Statistiken für den Kundenraum
  getKundenraumStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const userId = ctx.user.id;
      const orgId = ctx.user.organizationId;

      // Anzahl Custom-Templates
      const [templateCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(customSuperprompts)
        .where(
          or(
            eq(customSuperprompts.userId, userId),
            orgId ? eq(customSuperprompts.organizationId, orgId) : sql`FALSE`
          )
        );

      // Anzahl Kategorien
      const [categoryCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(templateCategories)
        .where(eq(templateCategories.userId, userId));

      // Gesamte Nutzungen
      const [usageSum] = await db
        .select({ total: sql<number>`COALESCE(SUM(${customSuperprompts.usageCount}), 0)` })
        .from(customSuperprompts)
        .where(
          or(
            eq(customSuperprompts.userId, userId),
            orgId ? eq(customSuperprompts.organizationId, orgId) : sql`FALSE`
          )
        );

      // Plan-Info laden
      const { getUserPlan, getUserUsage, checkLimit } = await import("../planFeatures");
      const plan = await getUserPlan(userId);
      const usage = await getUserUsage(userId);
      const taskLimit = await checkLimit(userId, "tasks");

      return {
        templateCount: Number(templateCount?.count || 0),
        categoryCount: Number(categoryCount?.count || 0),
        totalUsages: Number(usageSum?.total || 0),
        plan,
        usage,
        taskLimit,
      };
    }),

  // Anpassungswunsch für ein Template einreichen (nur für Kunden, nicht selbst anpassen)
  requestTemplateCustomization: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      description: z.string().min(10, "Bitte beschreiben Sie Ihren Anpassungswunsch (mind. 10 Zeichen)").max(2000),
      urgency: z.enum(["normal", "urgent", "asap"]).optional().default("normal"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const userId = ctx.user.id;
      const orgId = ctx.user.organizationId;

      // Lade das Template (entweder aus organizationTemplates oder taskTemplates)
      let templateTitle = "Unbekanntes Template";
      
      // Prüfe zuerst in organizationTemplates
      if (orgId) {
        const [orgTemplate] = await db
          .select({
            title: taskTemplates.title,
          })
          .from(organizationTemplates)
          .leftJoin(taskTemplates, eq(organizationTemplates.templateId, taskTemplates.id))
          .where(and(
            eq(organizationTemplates.organizationId, orgId),
            eq(organizationTemplates.templateId, input.templateId)
          ))
          .limit(1);
        
        if (orgTemplate?.title) {
          templateTitle = orgTemplate.title;
        }
      }

      // Falls nicht gefunden, prüfe in taskTemplates direkt
      if (templateTitle === "Unbekanntes Template") {
        const [template] = await db
          .select({ title: taskTemplates.title })
          .from(taskTemplates)
          .where(eq(taskTemplates.id, input.templateId))
          .limit(1);
        
        if (template?.title) {
          templateTitle = template.title;
        }
      }

      // Erstelle TaskRequest mit Typ "template_customization"
      const [result] = await db.insert(taskRequests).values({
        description: `[Anpassungswunsch für Template: ${templateTitle}]\n\n${input.description}`,
        userId,
        organizationId: orgId || null,
        urgency: input.urgency,
        status: "new",
        complexity: "custom", // Anpassungswünsche sind immer "custom"
        resultTemplateId: input.templateId,
      });

      // TODO: Benachrichtigung an Owner senden (notifyOwner)

      return {
        success: true,
        requestId: result.insertId,
        message: "Ihr Anpassungswunsch wurde eingereicht. Wir melden uns in Kürze bei Ihnen.",
      };
    }),

  // Anpassungswünsche des Users laden
  getMyCustomizationRequests: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const userId = ctx.user.id;

      const requests = await db
        .select({
          id: taskRequests.id,
          description: taskRequests.description,
          status: taskRequests.status,
          urgency: taskRequests.urgency,
          createdAt: taskRequests.createdAt,
          offerText: taskRequests.offerText,
          offerPrice: taskRequests.offerPrice,
          templateTitle: taskTemplates.title,
        })
        .from(taskRequests)
        .leftJoin(taskTemplates, eq(taskRequests.resultTemplateId, taskTemplates.id))
        .where(eq(taskRequests.userId, userId))
        .orderBy(desc(taskRequests.createdAt));

      return requests;
    }),
});
