import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAllBusinessAreas,
  getBusinessAreaById,
  getBusinessAreaBySlug,
  createBusinessArea,
  updateBusinessArea,
  deleteBusinessArea,
  reorderBusinessAreas,
  createAdminLog,
} from "../db";

// Admin-only Procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'owner') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Nur Administratoren haben Zugriff' });
  }
  return next({ ctx });
});

export const businessAreaRouter = router({
  // Alle Unternehmensbereiche laden (öffentlich für Dropdowns)
  list: publicProcedure
    .input(z.object({
      includeInactive: z.boolean().optional().default(false),
    }).optional())
    .query(async ({ input }) => {
      const includeInactive = input?.includeInactive ?? false;
      return getAllBusinessAreas(includeInactive);
    }),

  // Einzelnen Bereich laden
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const area = await getBusinessAreaById(input.id);
      if (!area) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Unternehmensbereich nicht gefunden' });
      }
      return area;
    }),

  // Bereich nach Slug laden
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const area = await getBusinessAreaBySlug(input.slug);
      if (!area) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Unternehmensbereich nicht gefunden' });
      }
      return area;
    }),

  // Neuen Bereich erstellen (nur Admin)
  create: adminProcedure
    .input(z.object({
      slug: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Nur Kleinbuchstaben, Zahlen und Unterstriche'),
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      icon: z.string().optional(),
      displayOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Prüfe ob Slug bereits existiert
      const existing = await getBusinessAreaBySlug(input.slug);
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Ein Unternehmensbereich mit diesem Slug existiert bereits' });
      }

      await createBusinessArea({
        ...input,
        createdBy: ctx.user.id,
        isActive: 1,
      });

      // Admin-Log erstellen
      await createAdminLog({
        userId: ctx.user.id,
        action: 'businessArea.create',
        targetType: 'businessArea',
        changes: JSON.stringify(input),
      });

      return { success: true, message: 'Unternehmensbereich erfolgreich erstellt' };
    }),

  // Bereich aktualisieren (nur Admin)
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/).optional(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      displayOrder: z.number().optional(),
      isActive: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      // Prüfe ob Bereich existiert
      const existing = await getBusinessAreaById(id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Unternehmensbereich nicht gefunden' });
      }

      // Prüfe ob neuer Slug bereits existiert
      if (data.slug && data.slug !== existing.slug) {
        const slugExists = await getBusinessAreaBySlug(data.slug);
        if (slugExists) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Ein Unternehmensbereich mit diesem Slug existiert bereits' });
        }
      }

      await updateBusinessArea(id, data);

      // Admin-Log erstellen
      await createAdminLog({
        userId: ctx.user.id,
        action: 'businessArea.update',
        targetType: 'businessArea',
        targetId: id,
        changes: JSON.stringify({ before: existing, after: data }),
      });

      return { success: true, message: 'Unternehmensbereich erfolgreich aktualisiert' };
    }),

  // Bereich löschen (nur Admin) - Soft Delete
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getBusinessAreaById(input.id);
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Unternehmensbereich nicht gefunden' });
      }

      await deleteBusinessArea(input.id);

      // Admin-Log erstellen
      await createAdminLog({
        userId: ctx.user.id,
        action: 'businessArea.delete',
        targetType: 'businessArea',
        targetId: input.id,
        changes: JSON.stringify(existing),
      });

      return { success: true, message: 'Unternehmensbereich erfolgreich gelöscht' };
    }),

  // Bereiche neu sortieren (nur Admin)
  reorder: adminProcedure
    .input(z.object({
      orderedIds: z.array(z.number()),
    }))
    .mutation(async ({ ctx, input }) => {
      await reorderBusinessAreas(input.orderedIds);

      // Admin-Log erstellen
      await createAdminLog({
        userId: ctx.user.id,
        action: 'businessArea.reorder',
        targetType: 'businessArea',
        changes: JSON.stringify({ newOrder: input.orderedIds }),
      });

      return { success: true, message: 'Reihenfolge erfolgreich aktualisiert' };
    }),
});
