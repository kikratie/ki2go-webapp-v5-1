import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  createAdminLog,
} from "../db";

// Admin-only Procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'owner') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Nur Administratoren haben Zugriff' });
  }
  return next({ ctx });
});

export const categoryRouter = router({
  // Alle Kategorien laden (öffentlich für Dropdowns)
  list: publicProcedure
    .input(z.object({
      includeInactive: z.boolean().optional().default(false),
    }).optional())
    .query(async ({ input }) => {
      const includeInactive = input?.includeInactive ?? false;
      return getAllCategories(includeInactive);
    }),

  // Einzelne Kategorie laden
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const category = await getCategoryById(input.id);
      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Kategorie nicht gefunden' });
      }
      return category;
    }),

  // Kategorie nach Slug laden
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const category = await getCategoryBySlug(input.slug);
      if (!category) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Kategorie nicht gefunden' });
      }
      return category;
    }),

  // Neue Kategorie erstellen (nur Admin)
  create: adminProcedure
    .input(z.object({
      slug: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Nur Kleinbuchstaben, Zahlen und Unterstriche'),
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      displayOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Prüfe ob Slug bereits existiert
      const existing = await getCategoryBySlug(input.slug);
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Eine Kategorie mit diesem Slug existiert bereits' });
      }

      await createCategory({
        ...input,
        createdBy: ctx.user.id,
        isActive: 1,
      });

      // Admin-Log erstellen
      await createAdminLog({
        userId: ctx.user.id,
        action: 'category.create',
        targetType: 'category',
        changes: JSON.stringify(input),
      });

      return { success: true, message: 'Kategorie erfolgreich erstellt' };
    }),

  // Kategorie aktualisieren (nur Admin)
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/).optional(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      displayOrder: z.number().optional(),
      isActive: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      // Prüfe ob Kategorie existiert
      const existing = await getCategoryById(id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Kategorie nicht gefunden' });
      }

      // Prüfe ob neuer Slug bereits existiert
      if (data.slug && data.slug !== existing.slug) {
        const slugExists = await getCategoryBySlug(data.slug);
        if (slugExists) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Eine Kategorie mit diesem Slug existiert bereits' });
        }
      }

      await updateCategory(id, data);

      // Admin-Log erstellen
      await createAdminLog({
        userId: ctx.user.id,
        action: 'category.update',
        targetType: 'category',
        targetId: id,
        changes: JSON.stringify({ before: existing, after: data }),
      });

      return { success: true, message: 'Kategorie erfolgreich aktualisiert' };
    }),

  // Kategorie löschen (nur Admin) - Soft Delete
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getCategoryById(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Kategorie nicht gefunden' });
      }

      await deleteCategory(input.id);

      // Admin-Log erstellen
      await createAdminLog({
        userId: ctx.user.id,
        action: 'category.delete',
        targetType: 'category',
        targetId: input.id,
        changes: JSON.stringify(existing),
      });

      return { success: true, message: 'Kategorie erfolgreich gelöscht' };
    }),

  // Kategorien neu sortieren (nur Admin)
  reorder: adminProcedure
    .input(z.object({
      orderedIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      await reorderCategories(input.orderedIds);

      // Admin-Log erstellen
      await createAdminLog({
        userId: ctx.user.id,
        action: 'category.reorder',
        targetType: 'category',
        changes: JSON.stringify({ newOrder: input.orderedIds }),
      });

      return { success: true, message: 'Reihenfolge erfolgreich aktualisiert' };
    }),
});
