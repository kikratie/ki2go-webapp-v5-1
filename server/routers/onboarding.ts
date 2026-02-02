import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  organizations,
  organizationMembers,
  organizationSubscriptions,
  organizationInvitations,
  organizationTemplates,
  subscriptionPlans,
  users,
  taskTemplates
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { sendInvitationEmail } from "../_core/email";

// Helper: Generiert einen eindeutigen Einladungs-Code
const generateInviteCode = (): string => {
  return randomBytes(16).toString("hex");
};

// Helper: Generiert einen Slug aus dem Namen
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[c] || c))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + Date.now().toString(36);
};

// Helper: Berechnet Ablaufdatum basierend auf Trial-Tagen
const calculateTrialEndDate = (trialDays: number): Date => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + trialDays);
  return endDate;
};

export const onboardingRouter = router({
  // Firma registrieren (erstellt Organisation + macht User zum Admin + aktiviert Test-Abo)
  registerCompany: protectedProcedure
    .input(z.object({
      companyName: z.string().min(2, "Firmenname muss mindestens 2 Zeichen haben"),
      industry: z.string().optional(),
      employeeCount: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfe ob User bereits einer Organisation angehört
      if (ctx.user.organizationId) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Sie gehören bereits einer Organisation an" 
        });
      }

      // Lade Test-Plan (oder erstelle Standard-Plan falls nicht vorhanden)
      let testPlan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.isTrialPlan, 1))
        .limit(1);

      // Falls kein Test-Plan existiert, erstelle einen
      if (!testPlan.length) {
        await db.insert(subscriptionPlans).values({
          name: "Test-Paket",
          slug: "test-paket",
          description: "Kostenlose Testphase mit vollem Funktionsumfang",
          userLimit: 10,
          creditLimit: null, // Unbegrenzt
          priceMonthly: "0.00",
          priceYearly: "0.00",
          isTrialPlan: 1,
          trialDays: 90, // 3 Monate
          features: ["Alle Templates", "Unbegrenzte Ausführungen", "E-Mail Support"],
          isActive: 1,
          displayOrder: 0,
        });

        testPlan = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.isTrialPlan, 1))
          .limit(1);
      }

      const plan = testPlan[0];

      // 1. Organisation erstellen
      const orgResult = await db.insert(organizations).values({
        name: input.companyName,
        slug: generateSlug(input.companyName),
        ownerId: ctx.user.id,
        settings: JSON.stringify({
          industry: input.industry,
          employeeCount: input.employeeCount,
        }),
      });

      const organizationId = Number((orgResult as any).insertId);

      // 2. User als Admin zur Organisation hinzufügen
      await db.insert(organizationMembers).values({
        organizationId,
        userId: ctx.user.id,
        role: "admin",
      });

      // 3. User-Datensatz aktualisieren (organizationId setzen, Rolle auf admin)
      await db
        .update(users)
        .set({ 
          organizationId,
          role: "admin",
        })
        .where(eq(users.id, ctx.user.id));

      // 4. Test-Subscription erstellen
      const validUntil = calculateTrialEndDate(plan.trialDays || 90);
      await db.insert(organizationSubscriptions).values({
        organizationId,
        planId: plan.id,
        status: "trial",
        validUntil,
        creditsUsed: 0,
        creditsTotal: plan.creditLimit,
      });

      // 5. Alle aktiven Templates der Organisation zuweisen
      const activeTemplates = await db
        .select({ id: taskTemplates.id })
        .from(taskTemplates)
        .where(eq(taskTemplates.status, "active"));

      for (const template of activeTemplates) {
        await db.insert(organizationTemplates).values({
          organizationId,
          templateId: template.id,
          isActive: 1,
          assignedBy: ctx.user.id,
        });
      }

      return {
        success: true,
        organizationId,
        organizationName: input.companyName,
        trialEndsAt: validUntil,
        trialDays: plan.trialDays || 90,
      };
    }),

  // Einladungs-Link erstellen
  createInvitation: protectedProcedure
    .input(z.object({
      email: z.string().email().optional(),
      role: z.enum(["admin", "member"]).default("member"),
      maxUses: z.number().min(1).max(100).optional(),
      expiresInDays: z.number().min(1).max(30).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfe ob User Admin seiner Organisation ist
      if (!ctx.user.organizationId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sie gehören keiner Organisation an" });
      }

      // Prüfe Admin-Berechtigung
      const membership = await db
        .select()
        .from(organizationMembers)
        .where(and(
          eq(organizationMembers.organizationId, ctx.user.organizationId),
          eq(organizationMembers.userId, ctx.user.id),
          sql`${organizationMembers.role} IN ('owner', 'admin')`
        ))
        .limit(1);

      if (!membership.length && ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Admins können Einladungen erstellen" });
      }

      // Generiere Einladungs-Code
      const inviteCode = generateInviteCode();

      // Berechne Ablaufdatum
      let expiresAt = null;
      if (input.expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
      }

      // Lade Organisation für E-Mail
      const org = await db
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, ctx.user.organizationId))
        .limit(1);

      // Erstelle Einladung
      const result = await db.insert(organizationInvitations).values({
        organizationId: ctx.user.organizationId,
        inviteCode,
        email: input.email,
        role: input.role,
        maxUses: input.maxUses || 1,
        usedCount: 0,
        expiresAt,
        createdBy: ctx.user.id,
      });

      // Sende Einladungs-E-Mail wenn E-Mail angegeben
      let emailSent = false;
      if (input.email && org.length) {
        try {
          emailSent = await sendInvitationEmail({
            to: input.email,
            inviterName: ctx.user.name || "Ein Teammitglied",
            organizationName: org[0].name,
            inviteToken: inviteCode,
          });
        } catch (error) {
          console.error("[Invitation] E-Mail-Versand fehlgeschlagen:", error);
        }
      }

      return {
        success: true,
        inviteCode,
        inviteUrl: `/einladung/${inviteCode}`,
        expiresAt,
        emailSent,
      };
    }),

  // Mit Einladungs-Code beitreten
  joinByCode: protectedProcedure
    .input(z.object({
      code: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfe ob User bereits einer Organisation angehört
      if (ctx.user.organizationId) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Sie gehören bereits einer Organisation an" 
        });
      }

      // Lade Einladung
      const invitation = await db
        .select()
        .from(organizationInvitations)
        .where(eq(organizationInvitations.inviteCode, input.code))
        .limit(1);

      if (!invitation.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ungültiger Einladungs-Code" });
      }

      const invite = invitation[0];

      // Prüfe Status
      if (invite.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Diese Einladung ist nicht mehr gültig" });
      }

      // Prüfe Ablaufdatum
      if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) {
        await db
          .update(organizationInvitations)
          .set({ status: "expired" })
          .where(eq(organizationInvitations.id, invite.id));
        throw new TRPCError({ code: "BAD_REQUEST", message: "Diese Einladung ist abgelaufen" });
      }

      // Prüfe max. Nutzungen
      if (invite.maxUses && (invite.usedCount ?? 0) >= invite.maxUses) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Diese Einladung wurde bereits verwendet" });
      }

      // Prüfe E-Mail (falls spezifisch)
      if (invite.email && invite.email !== ctx.user.email) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Diese Einladung ist für eine andere E-Mail-Adresse bestimmt" 
        });
      }

      // Lade Organisation
      const org = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, invite.organizationId))
        .limit(1);

      if (!org.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organisation nicht gefunden" });
      }

      // Prüfe User-Limit der Subscription
      const subscription = await db
        .select()
        .from(organizationSubscriptions)
        .innerJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(organizationSubscriptions.organizationId, invite.organizationId),
          sql`${organizationSubscriptions.status} IN ('trial', 'active')`
        ))
        .limit(1);

      if (subscription.length) {
        const plan = subscription[0].subscriptionPlans;
        if (plan.userLimit) {
          const memberCount = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(organizationMembers)
            .where(eq(organizationMembers.organizationId, invite.organizationId));
          
          if (memberCount[0].count >= plan.userLimit) {
            throw new TRPCError({ 
              code: "FORBIDDEN", 
              message: `Das User-Limit (${plan.userLimit}) für diese Organisation wurde erreicht` 
            });
          }
        }
      }

      // 1. User zur Organisation hinzufügen
      await db.insert(organizationMembers).values({
        organizationId: invite.organizationId,
        userId: ctx.user.id,
        role: invite.role || "member",
      });

      // 2. User-Datensatz aktualisieren
      await db
        .update(users)
        .set({ organizationId: invite.organizationId })
        .where(eq(users.id, ctx.user.id));

      // 3. Einladung aktualisieren
      const currentUsedCount = invite.usedCount ?? 0;
      const newUsedCount = currentUsedCount + 1;
      const newStatus = invite.maxUses && newUsedCount >= invite.maxUses ? "accepted" : "pending";
      
      await db
        .update(organizationInvitations)
        .set({ 
          usedCount: newUsedCount,
          status: newStatus,
          acceptedBy: ctx.user.id,
          acceptedAt: new Date(),
        })
        .where(eq(organizationInvitations.id, invite.id));

      return {
        success: true,
        organizationId: invite.organizationId,
        organizationName: org[0].name,
        role: invite.role,
      };
    }),

  // Einladungs-Details abrufen (für Einladungs-Seite)
  getInvitationDetails: publicProcedure
    .input(z.object({
      code: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const invitation = await db
        .select({
          id: organizationInvitations.id,
          organizationId: organizationInvitations.organizationId,
          organizationName: organizations.name,
          role: organizationInvitations.role,
          status: organizationInvitations.status,
          expiresAt: organizationInvitations.expiresAt,
          maxUses: organizationInvitations.maxUses,
          usedCount: organizationInvitations.usedCount,
        })
        .from(organizationInvitations)
        .innerJoin(organizations, eq(organizationInvitations.organizationId, organizations.id))
        .where(eq(organizationInvitations.inviteCode, input.code))
        .limit(1);

      if (!invitation.length) {
        return { valid: false, reason: "not_found" };
      }

      const invite = invitation[0];

      // Prüfe Status
      if (invite.status !== "pending") {
        return { valid: false, reason: "already_used" };
      }

      // Prüfe Ablaufdatum
      if (invite.expiresAt && new Date() > new Date(invite.expiresAt)) {
        return { valid: false, reason: "expired" };
      }

      // Prüfe max. Nutzungen
      if (invite.maxUses && (invite.usedCount ?? 0) >= invite.maxUses) {
        return { valid: false, reason: "max_uses_reached" };
      }

      return {
        valid: true,
        organizationName: invite.organizationName,
        role: invite.role,
      };
    }),

  // Offene Einladungen der Organisation laden
  getInvitations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    if (!ctx.user.organizationId) {
      return [];
    }

    // Prüfe Admin-Berechtigung
    const membership = await db
      .select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, ctx.user.organizationId),
        eq(organizationMembers.userId, ctx.user.id),
        sql`${organizationMembers.role} IN ('owner', 'admin')`
      ))
      .limit(1);

    if (!membership.length && ctx.user.role !== "owner") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Nur Admins können Einladungen sehen" });
    }

    const invitations = await db
      .select({
        id: organizationInvitations.id,
        inviteCode: organizationInvitations.inviteCode,
        email: organizationInvitations.email,
        role: organizationInvitations.role,
        status: organizationInvitations.status,
        maxUses: organizationInvitations.maxUses,
        usedCount: organizationInvitations.usedCount,
        expiresAt: organizationInvitations.expiresAt,
        createdAt: organizationInvitations.createdAt,
      })
      .from(organizationInvitations)
      .where(eq(organizationInvitations.organizationId, ctx.user.organizationId))
      .orderBy(desc(organizationInvitations.createdAt));

    return invitations;
  }),

  // Einladung widerrufen
  revokeInvitation: protectedProcedure
    .input(z.object({
      invitationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      if (!ctx.user.organizationId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sie gehören keiner Organisation an" });
      }

      // Prüfe ob Einladung zur Organisation gehört
      const invitation = await db
        .select()
        .from(organizationInvitations)
        .where(and(
          eq(organizationInvitations.id, input.invitationId),
          eq(organizationInvitations.organizationId, ctx.user.organizationId)
        ))
        .limit(1);

      if (!invitation.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Einladung nicht gefunden" });
      }

      // Widerrufen
      await db
        .update(organizationInvitations)
        .set({ status: "revoked" })
        .where(eq(organizationInvitations.id, input.invitationId));

      return { success: true };
    }),

  // Prüfen ob User bereits registriert ist (für Onboarding-Flow)
  checkRegistrationStatus: protectedProcedure.query(async ({ ctx }) => {
    return {
      isRegistered: !!ctx.user.organizationId,
      organizationId: ctx.user.organizationId,
      role: ctx.user.role,
    };
  }),
});
