import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { organizations, organizationMembers, organizationTemplates, users, taskTemplates } from "../../drizzle/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Helper: Prüft ob User Owner ist
const isOwner = (userRole: string) => userRole === "owner";

// Helper: Prüft ob User Admin einer Organisation ist
const isOrgAdmin = async (userId: number, orgId: number) => {
  const db = await getDb();
  if (!db) return false;
  
  const member = await db
    .select()
    .from(organizationMembers)
    .where(and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.organizationId, orgId),
      inArray(organizationMembers.role, ["owner", "admin"])
    ))
    .limit(1);
  return member.length > 0;
};

// Helper: Generiert einen Slug aus dem Namen
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] || c))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

export const organizationRouter = router({
  // Liste aller Organisationen (nur für Owner)
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!isOwner(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können alle Organisationen sehen" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        ownerId: organizations.ownerId,
        settings: organizations.settings,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .orderBy(desc(organizations.createdAt));

    return orgs;
  }),

  // Einzelne Organisation abrufen
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const org = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.id))
        .limit(1);

      if (!org.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organisation nicht gefunden" });
      }

      // Prüfe Berechtigung: Owner oder Mitglied
      if (!isOwner(ctx.user.role)) {
        const isMember = await db
          .select()
          .from(organizationMembers)
          .where(and(
            eq(organizationMembers.userId, ctx.user.id),
            eq(organizationMembers.organizationId, input.id)
          ))
          .limit(1);

        if (!isMember.length) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff auf diese Organisation" });
        }
      }

      // Lade Mitglieder
      const members = await db
        .select({
          id: organizationMembers.id,
          userId: organizationMembers.userId,
          role: organizationMembers.role,
          joinedAt: organizationMembers.joinedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(organizationMembers)
        .leftJoin(users, eq(organizationMembers.userId, users.id))
        .where(eq(organizationMembers.organizationId, input.id));

      // Lade zugewiesene Templates
      const templates = await db
        .select({
          id: organizationTemplates.id,
          templateId: organizationTemplates.templateId,
          isActive: organizationTemplates.isActive,
          assignedAt: organizationTemplates.assignedAt,
          templateName: taskTemplates.name,
          templateTitle: taskTemplates.title,
          templateSlug: taskTemplates.slug,
        })
        .from(organizationTemplates)
        .leftJoin(taskTemplates, eq(organizationTemplates.templateId, taskTemplates.id))
        .where(eq(organizationTemplates.organizationId, input.id));

      return {
        ...org[0],
        members,
        templates,
      };
    }),

  // Neue Organisation erstellen (nur Owner)
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(255),
      slug: z.string().optional(),
      settings: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isOwner(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können Organisationen erstellen" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const slug = input.slug || generateSlug(input.name);

      // Prüfe ob Slug bereits existiert
      const existing = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);

      if (existing.length) {
        throw new TRPCError({ code: "CONFLICT", message: "Eine Organisation mit diesem Slug existiert bereits" });
      }

      const result = await db.insert(organizations).values({
        name: input.name,
        slug,
        ownerId: ctx.user.id,
        settings: input.settings,
      });

      const orgId = Number(result[0].insertId);

      // Füge Owner als erstes Mitglied hinzu
      await db.insert(organizationMembers).values({
        organizationId: orgId,
        userId: ctx.user.id,
        role: "owner",
      });

      return { id: orgId, slug };
    }),

  // Organisation bearbeiten
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(2).max(255).optional(),
      slug: z.string().optional(),
      settings: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Prüfe Berechtigung
      if (!isOwner(ctx.user.role) && !(await isOrgAdmin(ctx.user.id, input.id))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung zum Bearbeiten" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const updateData: Record<string, any> = {};
      if (input.name) updateData.name = input.name;
      if (input.slug) updateData.slug = input.slug;
      if (input.settings !== undefined) updateData.settings = input.settings;

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Keine Änderungen angegeben" });
      }

      await db
        .update(organizations)
        .set(updateData)
        .where(eq(organizations.id, input.id));

      return { success: true };
    }),

  // Organisation löschen (nur Owner)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isOwner(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können Organisationen löschen" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Lösche alle Mitglieder
      await db.delete(organizationMembers).where(eq(organizationMembers.organizationId, input.id));

      // Lösche alle Template-Zuweisungen
      await db.delete(organizationTemplates).where(eq(organizationTemplates.organizationId, input.id));

      // Lösche Organisation
      await db.delete(organizations).where(eq(organizations.id, input.id));

      return { success: true };
    }),

  // Mitglied hinzufügen
  addMember: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      userId: z.number(),
      role: z.enum(["owner", "admin", "member"]).default("member"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Prüfe Berechtigung
      if (!isOwner(ctx.user.role) && !(await isOrgAdmin(ctx.user.id, input.organizationId))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung zum Hinzufügen von Mitgliedern" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfe ob User existiert
      const user = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Benutzer nicht gefunden" });
      }

      // Prüfe ob bereits Mitglied
      const existing = await db
        .select()
        .from(organizationMembers)
        .where(and(
          eq(organizationMembers.organizationId, input.organizationId),
          eq(organizationMembers.userId, input.userId)
        ))
        .limit(1);

      if (existing.length) {
        throw new TRPCError({ code: "CONFLICT", message: "Benutzer ist bereits Mitglied" });
      }

      await db.insert(organizationMembers).values({
        organizationId: input.organizationId,
        userId: input.userId,
        role: input.role,
      });

      // Update User's organizationId
      await db.update(users).set({ organizationId: input.organizationId }).where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Mitglied entfernen
  removeMember: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Prüfe Berechtigung
      if (!isOwner(ctx.user.role) && !(await isOrgAdmin(ctx.user.id, input.organizationId))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung zum Entfernen von Mitgliedern" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      await db
        .delete(organizationMembers)
        .where(and(
          eq(organizationMembers.organizationId, input.organizationId),
          eq(organizationMembers.userId, input.userId)
        ));

      // Clear User's organizationId
      await db.update(users).set({ organizationId: null }).where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Mitglieder-Rolle ändern
  updateMemberRole: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      userId: z.number(),
      role: z.enum(["owner", "admin", "member"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Prüfe Berechtigung
      if (!isOwner(ctx.user.role) && !(await isOrgAdmin(ctx.user.id, input.organizationId))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung zum Ändern von Rollen" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      await db
        .update(organizationMembers)
        .set({ role: input.role })
        .where(and(
          eq(organizationMembers.organizationId, input.organizationId),
          eq(organizationMembers.userId, input.userId)
        ));

      return { success: true };
    }),

  // Template einer Organisation zuweisen
  assignTemplate: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      templateId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Nur Owner kann Templates zuweisen
      if (!isOwner(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können Templates zuweisen" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfe ob Template existiert
      const template = await db.select().from(taskTemplates).where(eq(taskTemplates.id, input.templateId)).limit(1);
      if (!template.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template nicht gefunden" });
      }

      // Prüfe ob bereits zugewiesen
      const existing = await db
        .select()
        .from(organizationTemplates)
        .where(and(
          eq(organizationTemplates.organizationId, input.organizationId),
          eq(organizationTemplates.templateId, input.templateId)
        ))
        .limit(1);

      if (existing.length) {
        // Reaktiviere falls inaktiv
        await db
          .update(organizationTemplates)
          .set({ isActive: 1, assignedBy: ctx.user.id })
          .where(eq(organizationTemplates.id, existing[0].id));
      } else {
        await db.insert(organizationTemplates).values({
          organizationId: input.organizationId,
          templateId: input.templateId,
          assignedBy: ctx.user.id,
        });
      }

      return { success: true };
    }),

  // Template-Zuweisung entfernen
  removeTemplate: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      templateId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Nur Owner kann Templates entfernen
      if (!isOwner(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können Templates entfernen" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      await db
        .update(organizationTemplates)
        .set({ isActive: 0 })
        .where(and(
          eq(organizationTemplates.organizationId, input.organizationId),
          eq(organizationTemplates.templateId, input.templateId)
        ));

      return { success: true };
    }),

  // Alle verfügbaren Templates für eine Organisation
  getAvailableTemplates: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfe Berechtigung
      if (!isOwner(ctx.user.role)) {
        const isMember = await db
          .select()
          .from(organizationMembers)
          .where(and(
            eq(organizationMembers.userId, ctx.user.id),
            eq(organizationMembers.organizationId, input.organizationId)
          ))
          .limit(1);

        if (!isMember.length) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Kein Zugriff auf diese Organisation" });
        }
      }

      // Hole alle aktiven Templates dieser Organisation
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
          estimatedTimeSavings: taskTemplates.estimatedTimeSavings,
          documentRequired: taskTemplates.documentRequired,
          usageCount: taskTemplates.usageCount,
          avgRating: taskTemplates.avgRating,
        })
        .from(organizationTemplates)
        .innerJoin(taskTemplates, eq(organizationTemplates.templateId, taskTemplates.id))
        .where(and(
          eq(organizationTemplates.organizationId, input.organizationId),
          eq(organizationTemplates.isActive, 1),
          eq(taskTemplates.status, "active")
        ))
        .orderBy(taskTemplates.displayOrder);

      return templates;
    }),

  // Meine Organisation abrufen (für eingeloggten User)
  getMyOrganization: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    // Finde Organisation des Users
    const membership = await db
      .select({
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role,
        orgName: organizations.name,
        orgSlug: organizations.slug,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, ctx.user.id))
      .limit(1);

    if (!membership.length) {
      return null;
    }

    return {
      organizationId: membership[0].organizationId,
      role: membership[0].role,
      name: membership[0].orgName,
      slug: membership[0].orgSlug,
    };
  }),

  // Alle Benutzer auflisten (für Mitglieder-Zuweisung)
  listUsers: protectedProcedure.query(async ({ ctx }) => {
    if (!isOwner(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können alle Benutzer sehen" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        organizationId: users.organizationId,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(desc(users.lastSignedIn));

    return allUsers;
  }),

  // Logo hochladen/aktualisieren
  updateLogo: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      logoUrl: z.string().url().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfe Berechtigung: Owner oder Org-Admin
      if (!isOwner(ctx.user.role) && !(await isOrgAdmin(ctx.user.id, input.organizationId))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
      }

      await db
        .update(organizations)
        .set({ logoUrl: input.logoUrl })
        .where(eq(organizations.id, input.organizationId));

      return { success: true };
    }),

  // Kundenraum-Daten laden (für Header-Branding)
  getKundenraumInfo: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    // Finde die Organisation des Users
    const user = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user.length || !user[0].organizationId) {
      return null; // User hat keine Organisation
    }

    const org = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        logoUrl: organizations.logoUrl,
        industry: organizations.industry,
      })
      .from(organizations)
      .where(eq(organizations.id, user[0].organizationId))
      .limit(1);

    return org.length ? org[0] : null;
  }),

  // Organisation aktualisieren (Name, Branche, etc.)
  updateDetails: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      name: z.string().min(2).optional(),
      industry: z.string().optional(),
      employeeCount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfe Berechtigung: Owner oder Org-Admin
      if (!isOwner(ctx.user.role) && !(await isOrgAdmin(ctx.user.id, input.organizationId))) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung" });
      }

      const updateData: Record<string, unknown> = {};
      if (input.name) updateData.name = input.name;
      if (input.industry !== undefined) updateData.industry = input.industry;
      if (input.employeeCount !== undefined) updateData.employeeCount = input.employeeCount;

      if (Object.keys(updateData).length > 0) {
        await db
          .update(organizations)
          .set(updateData)
          .where(eq(organizations.id, input.organizationId));
      }

      return { success: true };
    }),
});
