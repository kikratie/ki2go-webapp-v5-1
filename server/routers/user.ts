import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  users, 
  organizations, 
  organizationMembers,
  workflowExecutions,
  documents,
  adminAuditLog,
  userSubscriptions,
  plans
} from "../../drizzle/schema";
import { eq, desc, sql, and, or, like, count, inArray } from "drizzle-orm";

// Helper: Nur Owner darf zugreifen
const ownerOnlyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "owner") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nur für Owner zugänglich" });
  }
  return next({ ctx });
});

// Helper: Admin oder Owner darf zugreifen
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "owner" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Nur für Administratoren zugänglich" });
  }
  return next({ ctx });
});

// Branchen-Liste für Dropdown
const INDUSTRIES = [
  "Handel & E-Commerce",
  "Dienstleistungen",
  "Produktion & Industrie",
  "Bau & Handwerk",
  "IT & Software",
  "Beratung & Consulting",
  "Gesundheit & Pflege",
  "Bildung & Training",
  "Tourismus & Gastronomie",
  "Immobilien",
  "Finanzen & Versicherung",
  "Marketing & Werbung",
  "Logistik & Transport",
  "Energie & Umwelt",
  "Landwirtschaft",
  "Sonstige"
];

// Wie haben Sie uns gefunden?
const HOW_FOUND_OPTIONS = [
  "Google-Suche",
  "Social Media (LinkedIn, Facebook, etc.)",
  "Empfehlung von Kollegen/Geschäftspartnern",
  "Veranstaltung/Messe",
  "Werbung",
  "Presseartikel",
  "Newsletter",
  "Sonstige"
];

export const userRouter = router({
  // ==================== PROFIL-VERWALTUNG ====================
  
  // Aktuelles Profil abrufen
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Benutzer nicht gefunden" });
    }

    // Lade Organisation falls vorhanden
    let organization = null;
    if (user[0].organizationId) {
      const orgs = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user[0].organizationId))
        .limit(1);
      organization = orgs[0] || null;
    }

    return {
      ...user[0],
      organization,
      industries: INDUSTRIES,
      howFoundOptions: HOW_FOUND_OPTIONS
    };
  }),

  // Prüfen ob Profil vollständig ist
  checkProfileComplete: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    const user = await db
      .select({
        profileCompleted: users.profileCompleted,
        termsAcceptedAt: users.termsAcceptedAt,
        privacyAcceptedAt: users.privacyAcceptedAt,
        companyName: users.companyName,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user.length) {
      return { complete: false, missingFields: ["user"] };
    }

    const u = user[0];
    const missingFields: string[] = [];

    // Pflichtfelder prüfen
    if (!u.name) missingFields.push("name");
    if (!u.email) missingFields.push("email");
    if (!u.companyName) missingFields.push("companyName");
    if (!u.termsAcceptedAt) missingFields.push("termsAccepted");
    if (!u.privacyAcceptedAt) missingFields.push("privacyAccepted");

    return {
      complete: missingFields.length === 0 && u.profileCompleted === 1,
      missingFields,
      profileCompleted: u.profileCompleted === 1
    };
  }),

  // Profil vervollständigen
  completeProfile: protectedProcedure
    .input(z.object({
      userType: z.enum(["business", "private"]),
      displayName: z.string().min(2).optional(), // Name des Users
      companyName: z.string().optional(), // Pflicht nur bei business
      position: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().default("Österreich"),
      industry: z.string().optional(),
      howFound: z.string().optional(),
      termsAccepted: z.boolean(),
      privacyAccepted: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Validierung
      if (!input.termsAccepted) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "AGB müssen akzeptiert werden" });
      }
      if (!input.privacyAccepted) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Datenschutzerklärung muss akzeptiert werden" });
      }

      // Bei Unternehmen ist Firmenname Pflicht
      if (input.userType === "business" && (!input.companyName || input.companyName.length < 2)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Firmenname ist für Unternehmen erforderlich" });
      }

      const now = new Date();
      
      // Bei Privatperson: companyName = "Privat"
      const companyName = input.userType === "private" ? "Privat" : input.companyName;

      // === AUTOMATISCHE ORGANIZATION ERSTELLEN (Kundenraum) ===
      // Prüfe ob User bereits eine Organization hat
      const existingUser = await db
        .select({ organizationId: users.organizationId })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      
      let organizationId = existingUser[0]?.organizationId;
      
      // Wenn noch keine Organization, erstelle eine neue
      if (!organizationId) {
        // Generiere einen eindeutigen Slug
        const slug = `${(companyName || 'kunde').toLowerCase().replace(/[^a-z0-9]/g, '-')}-${ctx.user.id}`;
        
        // Organization erstellen
        const [newOrg] = await db
          .insert(organizations)
          .values({
            name: companyName || `Kundenraum ${ctx.user.name}`,
            slug: slug,
            ownerId: ctx.user.id,
            industry: input.industry || null,
            createdAt: now,
            updatedAt: now,
          });
        
        // Hole die ID der neuen Organization
        const [createdOrg] = await db
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.slug, slug))
          .limit(1);
        
        organizationId = createdOrg?.id;
        
        // User als Owner der Organization hinzufügen
        if (organizationId) {
          await db.insert(organizationMembers).values({
            organizationId: organizationId,
            userId: ctx.user.id,
            role: "owner",
            joinedAt: now,
          });
        }
      }

      // === AUTOMATISCHE TRIAL-SUBSCRIPTION ERSTELLEN ===
      // Prüfe ob User bereits eine Subscription hat
      const existingSubscription = await db
        .select({ id: userSubscriptions.id })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, ctx.user.id))
        .limit(1);
      
      if (!existingSubscription.length) {
        // Hole den Starter-Plan (Default)
        const [starterPlan] = await db
          .select({ id: plans.id })
          .from(plans)
          .where(eq(plans.isDefault, true))
          .limit(1);
        
        if (starterPlan) {
          // Trial-Dauer: 14 Tage
          const trialDays = 14;
          const validUntil = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
          
          await db.insert(userSubscriptions).values({
            userId: ctx.user.id,
            planId: starterPlan.id,
            status: "trial",
            startedAt: now,
            validUntil: validUntil,
            billingCycle: "monthly",
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // User-Profil aktualisieren (inkl. organizationId)
      await db
        .update(users)
        .set({
          name: input.displayName || ctx.user.name,
          userType: input.userType,
          companyName: companyName,
          position: input.userType === "business" ? (input.position || null) : null,
          phone: input.phone || null,
          address: input.address || null,
          city: input.city || null,
          postalCode: input.postalCode || null,
          country: input.country,
          industry: input.userType === "business" ? (input.industry || null) : null,
          howFound: input.howFound || null,
          termsAcceptedAt: now,
          privacyAcceptedAt: now,
          profileCompleted: 1,
          organizationId: organizationId || null, // Setze die Organization-ID
          updatedAt: now,
        })
        .where(eq(users.id, ctx.user.id));

      // Willkommens-Benachrichtigung an Owner senden
      const userTypeLabel = input.userType === "business" ? "Unternehmen" : "Privatperson";
      const welcomeContent = `
**Neuer Benutzer hat sein Profil vervollständigt!**

- **Name:** ${ctx.user.name}
- **E-Mail:** ${ctx.user.email}
- **Typ:** ${userTypeLabel}
- **Firma:** ${companyName || "-"}
- **Position:** ${input.position || "-"}
- **Branche:** ${input.industry || "-"}
- **Wie gefunden:** ${input.howFound || "-"}
- **Zeitpunkt:** ${now.toLocaleString("de-AT")}
      `.trim();

      // Benachrichtigung im Hintergrund senden (nicht blockierend)
      notifyOwner({
        title: `Willkommen bei KI2GO: ${ctx.user.name}`,
        content: welcomeContent,
      }).catch(err => console.warn("[User] Willkommens-Benachrichtigung fehlgeschlagen:", err));

      return { success: true, message: "Profil erfolgreich vervollständigt" };
    }),

  // Profil aktualisieren (für bestehende User)
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2).optional(),
      userType: z.enum(["business", "private"]).optional(),
      companyName: z.string().optional(), // Kann leer sein bei Privatperson
      position: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      industry: z.string().optional(),
      howFound: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Validierung: Bei Business muss Firmenname vorhanden sein
      if (input.userType === "business" && input.companyName !== undefined && input.companyName.length < 2) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Firmenname ist für Unternehmen erforderlich (min. 2 Zeichen)" });
      }

      // Bei Privatperson: companyName = "Privat" wenn nicht anders angegeben
      const updateData: Record<string, any> = {
        ...input,
        updatedAt: new Date(),
      };

      // Wenn userType auf private geändert wird, setze companyName auf "Privat"
      if (input.userType === "private" && !input.companyName) {
        updateData.companyName = "Privat";
      }

      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, ctx.user.id));

      return { success: true, message: "Profil erfolgreich aktualisiert" };
    }),

  // Dropdown-Optionen abrufen
  getOptions: publicProcedure.query(() => {
    return {
      industries: INDUSTRIES,
      howFoundOptions: HOW_FOUND_OPTIONS
    };
  }),

  // ==================== USER-VERWALTUNG (OWNER/ADMIN) ====================

  // Alle User auflisten
  list: ownerOnlyProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      status: z.enum(["all", "active", "suspended", "deleted"]).default("all"),
      organizationId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;

      // Basis-Query
      let conditions: any[] = [];

      // Status-Filter
      if (input?.status && input.status !== "all") {
        conditions.push(eq(users.status, input.status));
      }

      // Organisation-Filter
      if (input?.organizationId) {
        conditions.push(eq(users.organizationId, input.organizationId));
      }

      // Suche
      if (input?.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            like(users.name, searchTerm),
            like(users.email, searchTerm),
            like(users.companyName, searchTerm)
          )
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // User abrufen
      const userList = await db
        .select({
          id: users.id,
          openId: users.openId,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
          companyName: users.companyName,
          position: users.position,
          phone: users.phone,
          industry: users.industry,
          organizationId: users.organizationId,
          profileCompleted: users.profileCompleted,
          termsAcceptedAt: users.termsAcceptedAt,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      // Total count
      const totalResult = await db
        .select({ count: count() })
        .from(users)
        .where(whereClause);

      const total = totalResult[0]?.count || 0;

      // Organisation-Namen laden
      const orgIds = Array.from(new Set(userList.filter(u => u.organizationId).map(u => u.organizationId!)));
      let orgMap: Record<number, string> = {};
      
      if (orgIds.length > 0) {
        const orgs = await db
          .select({ id: organizations.id, name: organizations.name })
          .from(organizations)
          .where(inArray(organizations.id, orgIds));
        
        orgMap = Object.fromEntries(orgs.map(o => [o.id, o.name]));
      }

      // Statistiken für jeden User laden
      const userIds = userList.map(u => u.id);
      
      // Execution counts
      const execCounts = userIds.length > 0 ? await db
        .select({
          userId: workflowExecutions.userId,
          count: count(),
          totalCost: sql<number>`COALESCE(SUM(${workflowExecutions.estimatedCost}), 0)`,
        })
        .from(workflowExecutions)
        .where(inArray(workflowExecutions.userId, userIds))
        .groupBy(workflowExecutions.userId) : [];
      
      const execMap = Object.fromEntries(execCounts.map(e => [e.userId, { count: e.count, cost: e.totalCost }]));
      
      // Document counts
      const docCounts = userIds.length > 0 ? await db
        .select({
          userId: documents.userId,
          count: count(),
        })
        .from(documents)
        .where(inArray(documents.userId, userIds))
        .groupBy(documents.userId) : [];
      
      const docMap = Object.fromEntries(docCounts.map(d => [d.userId, d.count]));

      return {
        users: userList.map(u => ({
          ...u,
          organizationName: u.organizationId ? orgMap[u.organizationId] : null,
          executionCount: execMap[u.id]?.count || 0,
          documentCount: docMap[u.id] || 0,
          totalCost: Number(execMap[u.id]?.cost || 0),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }),

  // Einzelnen User abrufen
  getById: ownerOnlyProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      if (!user.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Benutzer nicht gefunden" });
      }

      // Organisation laden
      let organization = null;
      if (user[0].organizationId) {
        const orgs = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, user[0].organizationId))
          .limit(1);
        organization = orgs[0] || null;
      }

      // Statistiken laden
      const executions = await db
        .select({ count: count() })
        .from(workflowExecutions)
        .where(eq(workflowExecutions.userId, input.id));

      const docs = await db
        .select({ count: count() })
        .from(documents)
        .where(eq(documents.userId, input.id));

      return {
        ...user[0],
        organization,
        stats: {
          executions: executions[0]?.count || 0,
          documents: docs[0]?.count || 0
        }
      };
    }),

  // User-Status ändern (sperren/entsperren)
  setStatus: ownerOnlyProcedure
    .input(z.object({
      userId: z.number(),
      status: z.enum(["active", "suspended", "deleted"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfen ob User existiert
      const user = await db
        .select({ id: users.id, name: users.name, email: users.email, status: users.status })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Benutzer nicht gefunden" });
      }

      // Sich selbst nicht sperren
      if (input.userId === ctx.user.id && input.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sie können sich nicht selbst sperren" });
      }

      const oldStatus = user[0].status;

      // Status aktualisieren
      await db
        .update(users)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      // Audit-Log erstellen
      await db.insert(adminAuditLog).values({
        adminUserId: ctx.user.id,
        adminUserName: ctx.user.name || "Admin",
        action: input.status === "deleted" ? "user_deleted" : 
                input.status === "suspended" ? "user_suspended" : "user_activated",
        actionCategory: "user_management",
        targetType: "user",
        targetId: input.userId,
        targetName: user[0].name || user[0].email || null,
        previousValue: { status: oldStatus },
        newValue: { status: input.status, reason: input.reason },
        description: `User-Status geändert: ${oldStatus} -> ${input.status}`,
        createdAt: new Date(),
      });

      const statusText = {
        active: "aktiviert",
        suspended: "gesperrt",
        deleted: "gelöscht"
      };

      return { 
        success: true, 
        message: `Benutzer ${user[0].name || user[0].email} wurde ${statusText[input.status]}` 
      };
    }),

  // User löschen (DSGVO-konform)
  delete: ownerOnlyProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string().optional(),
      hardDelete: z.boolean().default(false), // true = Daten komplett löschen
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfen ob User existiert
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Benutzer nicht gefunden" });
      }

      // Sich selbst nicht löschen
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sie können sich nicht selbst löschen" });
      }

      // Owner nicht löschen
      if (user[0].role === "owner") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Owner-Accounts können nicht gelöscht werden" });
      }

      if (input.hardDelete) {
        // DSGVO: Alle personenbezogenen Daten löschen
        // Workflow-Executions: User-ID bleibt erhalten für Audit-Zwecke
        // (userId ist NOT NULL, daher keine Anonymisierung möglich)

        // Dokumente löschen
        await db
          .delete(documents)
          .where(eq(documents.userId, input.userId));

        // Aus Organisationen entfernen
        await db
          .delete(organizationMembers)
          .where(eq(organizationMembers.userId, input.userId));

        // User komplett löschen
        await db
          .delete(users)
          .where(eq(users.id, input.userId));

        // Audit-Log
        await db.insert(adminAuditLog).values({
          adminUserId: ctx.user.id,
          adminUserName: ctx.user.name || "Admin",
          action: "user_hard_deleted",
          actionCategory: "user_management",
          targetType: "user",
          targetId: input.userId,
          targetName: user[0].name || user[0].email || null,
          previousValue: { 
            name: user[0].name, 
            email: user[0].email,
            companyName: user[0].companyName 
          },
          newValue: { reason: input.reason, hardDelete: true },
          description: "User und alle Daten DSGVO-konform gelöscht",
          createdAt: new Date(),
        });

        return { 
          success: true, 
          message: "Benutzer und alle zugehörigen Daten wurden DSGVO-konform gelöscht" 
        };
      } else {
        // Soft-Delete: Status auf "deleted" setzen, Daten anonymisieren
        await db
          .update(users)
          .set({
            status: "deleted",
            name: "[Gelöscht]",
            email: `deleted_${input.userId}@deleted.local`,
            companyName: null,
            position: null,
            phone: null,
            address: null,
            city: null,
            postalCode: null,
            industry: null,
            howFound: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, input.userId));

        // Aus Organisationen entfernen
        await db
          .delete(organizationMembers)
          .where(eq(organizationMembers.userId, input.userId));

        // Audit-Log
        await db.insert(adminAuditLog).values({
          adminUserId: ctx.user.id,
          adminUserName: ctx.user.name || "Admin",
          action: "user_soft_deleted",
          actionCategory: "user_management",
          targetType: "user",
          targetId: input.userId,
          targetName: user[0].name || user[0].email || null,
          previousValue: { 
            name: user[0].name, 
            email: user[0].email 
          },
          newValue: { reason: input.reason, hardDelete: false },
          description: "User anonymisiert und als gelöscht markiert",
          createdAt: new Date(),
        });

        return { 
          success: true, 
          message: "Benutzer wurde anonymisiert und als gelöscht markiert" 
        };
      }
    }),

  // User-Rolle ändern
  setRole: ownerOnlyProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfen ob User existiert
      const user = await db
        .select({ id: users.id, role: users.role, name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Benutzer nicht gefunden" });
      }

      // Owner-Rolle kann nicht geändert werden
      if (user[0].role === "owner") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Owner-Rolle kann nicht geändert werden" });
      }

      const oldRole = user[0].role;

      await db
        .update(users)
        .set({
          role: input.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      // Audit-Log
      await db.insert(adminAuditLog).values({
        adminUserId: ctx.user.id,
        adminUserName: ctx.user.name || "Admin",
        action: "user_role_changed",
        actionCategory: "user_management",
        targetType: "user",
        targetId: input.userId,
        targetName: user[0].name || null,
        previousValue: { role: oldRole },
        newValue: { role: input.role },
        description: `Rolle geändert: ${oldRole} -> ${input.role}`,
        createdAt: new Date(),
      });

      return { 
        success: true, 
        message: `Rolle von ${user[0].name} wurde zu ${input.role} geändert` 
      };
    }),

  // User einer Organisation zuweisen
  assignOrganization: ownerOnlyProcedure
    .input(z.object({
      userId: z.number(),
      organizationId: z.number().nullable(),
      role: z.enum(["member", "admin"]).default("member"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfen ob User existiert
      const user = await db
        .select({ id: users.id, organizationId: users.organizationId, name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Benutzer nicht gefunden" });
      }

      const oldOrgId = user[0].organizationId;

      // Aus alter Organisation entfernen
      if (oldOrgId) {
        await db
          .delete(organizationMembers)
          .where(and(
            eq(organizationMembers.userId, input.userId),
            eq(organizationMembers.organizationId, oldOrgId)
          ));
      }

      if (input.organizationId) {
        // Prüfen ob Organisation existiert
        const org = await db
          .select({ id: organizations.id, name: organizations.name })
          .from(organizations)
          .where(eq(organizations.id, input.organizationId))
          .limit(1);

        if (!org.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Organisation nicht gefunden" });
        }

        // User zur neuen Organisation hinzufügen
        await db.insert(organizationMembers).values({
          userId: input.userId,
          organizationId: input.organizationId,
          role: input.role,
          joinedAt: new Date(),
        });

        // User-Tabelle aktualisieren
        await db
          .update(users)
          .set({
            organizationId: input.organizationId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, input.userId));

        return { 
          success: true, 
          message: `${user[0].name} wurde der Organisation "${org[0].name}" zugewiesen` 
        };
      } else {
        // Aus Organisation entfernen
        await db
          .update(users)
          .set({
            organizationId: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, input.userId));

        return { 
          success: true, 
          message: `${user[0].name} wurde aus der Organisation entfernt` 
        };
      }
    }),

  // DSGVO: Datenexport für User
  exportMyData: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    // Alle User-Daten sammeln
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Benutzer nicht gefunden" });
    }

    // Workflow-Executions
    const executions = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.userId, ctx.user.id))
      .orderBy(desc(workflowExecutions.startedAt));

    // Dokumente
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, ctx.user.id))
      .orderBy(desc(documents.uploadedAt));

    // Organisation
    let organization = null;
    if (user[0].organizationId) {
      const orgs = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, user[0].organizationId))
        .limit(1);
      organization = orgs[0] || null;
    }

    return {
      exportedAt: new Date().toISOString(),
      userData: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
        companyName: user[0].companyName,
        position: user[0].position,
        phone: user[0].phone,
        address: user[0].address,
        city: user[0].city,
        postalCode: user[0].postalCode,
        country: user[0].country,
        industry: user[0].industry,
        howFound: user[0].howFound,
        role: user[0].role,
        createdAt: user[0].createdAt,
        lastSignedIn: user[0].lastSignedIn,
        termsAcceptedAt: user[0].termsAcceptedAt,
        privacyAcceptedAt: user[0].privacyAcceptedAt,
      },
      organization: organization ? {
        id: organization.id,
        name: organization.name,
      } : null,
      workflowExecutions: executions.map(e => ({
        id: e.id,
        templateId: e.templateId,
        status: e.status,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
      })),
      documents: docs.map(d => ({
        id: d.id,
        fileName: d.fileName,
        mimeType: d.mimeType,
        uploadedAt: d.uploadedAt,
      })),
    };
  }),

  // DSGVO: Account-Löschung beantragen
  requestDeletion: protectedProcedure
    .input(z.object({
      reason: z.string().optional(),
      confirmEmail: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // E-Mail-Bestätigung prüfen
      const user = await db
        .select({ email: users.email, role: users.role })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Benutzer nicht gefunden" });
      }

      if (user[0].email?.toLowerCase() !== input.confirmEmail.toLowerCase()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "E-Mail-Adresse stimmt nicht überein" });
      }

      // Owner kann sich nicht selbst löschen
      if (user[0].role === "owner") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Owner-Accounts können nicht gelöscht werden" });
      }

      // Audit-Log für Löschantrag
      await db.insert(adminAuditLog).values({
        adminUserId: ctx.user.id,
        adminUserName: ctx.user.name || "User",
        action: "user_deletion_requested",
        actionCategory: "user_management",
        targetType: "user",
        targetId: ctx.user.id,
        targetName: ctx.user.name || null,
        previousValue: null,
        newValue: { reason: input.reason },
        description: "DSGVO-Löschantrag vom User selbst",
        createdAt: new Date(),
      });

      // Status auf "deleted" setzen und Daten anonymisieren
      await db
        .update(users)
        .set({
          status: "deleted",
          name: "[Gelöscht]",
          email: `deleted_${ctx.user.id}@deleted.local`,
          companyName: null,
          position: null,
          phone: null,
          address: null,
          city: null,
          postalCode: null,
          industry: null,
          howFound: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      // Aus Organisationen entfernen
      await db
        .delete(organizationMembers)
        .where(eq(organizationMembers.userId, ctx.user.id));

      return { 
        success: true, 
        message: "Ihr Account wurde gelöscht. Ihre Daten wurden anonymisiert." 
      };
    }),

  // Onboarding als abgeschlossen markieren
  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    await db
      .update(users)
      .set({
        hasCompletedOnboarding: 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.user.id));

    return { success: true };
  }),
});
