import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { 
  testSessions, 
  testUsers, 
  organizations, 
  organizationMembers,
  organizationSubscriptions,
  subscriptionPlans,
  categories,
  businessAreas
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// Helper: Prüfen ob User Owner ist
const isOwner = (role: string | null | undefined) => role === "owner";

export const testroomRouter = router({
  // ==================== TEST-SESSION MANAGEMENT ====================

  // Aktuellen Test-Modus abfragen
  getCurrentMode: protectedProcedure.query(async ({ ctx }) => {
    if (!isOwner(ctx.user.role)) {
      return { isInTestMode: false, session: null };
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const [activeSession] = await db
      .select()
      .from(testSessions)
      .where(and(
        eq(testSessions.ownerUserId, ctx.user.id),
        eq(testSessions.isActive, 1)
      ))
      .limit(1);

    return {
      isInTestMode: !!activeSession,
      session: activeSession || null
    };
  }),

  // In Test-Modus wechseln
  enterTestMode: protectedProcedure
    .input(z.object({
      testMode: z.enum(["user", "firma_admin", "firma_member"]),
      scenario: z.enum([
        "normal", 
        "credits_low", 
        "credits_empty", 
        "subscription_expiring", 
        "subscription_expired", 
        "account_suspended"
      ]).default("normal"),
      simulatedPlanId: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isOwner(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können den Testraum nutzen" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Bestehende aktive Session beenden
      await db
        .update(testSessions)
        .set({ isActive: 0, endedAt: new Date() })
        .where(and(
          eq(testSessions.ownerUserId, ctx.user.id),
          eq(testSessions.isActive, 1)
        ));

      // Test-Organisation finden oder erstellen
      let testOrg = await db
        .select()
        .from(organizations)
        .where(and(
          eq(organizations.ownerId, ctx.user.id),
          eq(organizations.slug, `test-org-${ctx.user.id}`)
        ))
        .then(rows => rows[0]);

      if (!testOrg) {
        // Test-Organisation erstellen
        const [result] = await db.insert(organizations).values({
          name: "KI2GO Test-Firma",
          slug: `test-org-${ctx.user.id}`,
          ownerId: ctx.user.id,
          customerNumber: `TEST-${ctx.user.id}`,
          industry: "Test",
          employeeCount: 10
        });
        
        const testOrgId = result.insertId;
        testOrg = { id: testOrgId } as any;

        // Owner als Admin der Test-Organisation hinzufügen
        await db.insert(organizationMembers).values({
          organizationId: testOrgId,
          userId: ctx.user.id,
          role: input.testMode === "firma_admin" ? "admin" : "member"
        });

        // Test-Subscription erstellen
        const [defaultPlan] = await db
          .select()
          .from(subscriptionPlans)
          .where(eq(subscriptionPlans.isActive, 1))
          .limit(1);

        if (defaultPlan) {
          const validUntil = new Date();
          validUntil.setMonth(validUntil.getMonth() + 3);

          await db.insert(organizationSubscriptions).values({
            organizationId: testOrgId,
            planId: input.simulatedPlanId || defaultPlan.id,
            status: "trial",
            validUntil,
            creditsUsed: 0,
            creditsTotal: defaultPlan.creditLimit || 100
          });
        }
      }

      // Simulierte Credits basierend auf Szenario
      let simulatedCreditsUsed = null;
      let simulatedCreditsTotal = null;

      if (input.scenario === "credits_low") {
        simulatedCreditsTotal = 100;
        simulatedCreditsUsed = 85; // 85% verbraucht
      } else if (input.scenario === "credits_empty") {
        simulatedCreditsTotal = 100;
        simulatedCreditsUsed = 100; // 100% verbraucht
      }

      // Neue Test-Session erstellen
      const [sessionResult] = await db.insert(testSessions).values({
        ownerUserId: ctx.user.id,
        testMode: input.testMode,
        testOrganizationId: testOrg.id,
        simulatedScenario: input.scenario,
        simulatedPlanId: input.simulatedPlanId || null,
        simulatedCreditsUsed,
        simulatedCreditsTotal,
        isActive: 1
      });

      return {
        success: true,
        sessionId: sessionResult.insertId,
        testOrganizationId: testOrg.id,
        message: `Test-Modus aktiviert: ${input.testMode}`
      };
    }),

  // Test-Modus beenden
  exitTestMode: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isOwner(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können den Testraum nutzen" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    await db
      .update(testSessions)
      .set({ isActive: 0, endedAt: new Date() })
      .where(and(
        eq(testSessions.ownerUserId, ctx.user.id),
        eq(testSessions.isActive, 1)
      ));

    return { success: true, message: "Test-Modus beendet" };
  }),

  // Szenario ändern (ohne Session neu zu starten)
  changeScenario: protectedProcedure
    .input(z.object({
      scenario: z.enum([
        "normal", 
        "credits_low", 
        "credits_empty", 
        "subscription_expiring", 
        "subscription_expired", 
        "account_suspended"
      ])
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isOwner(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können den Testraum nutzen" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Simulierte Credits basierend auf Szenario
      let simulatedCreditsUsed = null;
      let simulatedCreditsTotal = null;

      if (input.scenario === "credits_low") {
        simulatedCreditsTotal = 100;
        simulatedCreditsUsed = 85;
      } else if (input.scenario === "credits_empty") {
        simulatedCreditsTotal = 100;
        simulatedCreditsUsed = 100;
      }

      await db
        .update(testSessions)
        .set({ 
          simulatedScenario: input.scenario,
          simulatedCreditsUsed,
          simulatedCreditsTotal
        })
        .where(and(
          eq(testSessions.ownerUserId, ctx.user.id),
          eq(testSessions.isActive, 1)
        ));

      return { success: true, scenario: input.scenario };
    }),

  // ==================== TEST-USER MANAGEMENT ====================

  // Alle Test-User laden
  getTestUsers: protectedProcedure.query(async ({ ctx }) => {
    if (!isOwner(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können Test-User verwalten" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Aktive Test-Session finden
    const [activeSession] = await db
      .select()
      .from(testSessions)
      .where(and(
        eq(testSessions.ownerUserId, ctx.user.id),
        eq(testSessions.isActive, 1)
      ))
      .limit(1);

    if (!activeSession?.testOrganizationId) {
      return [];
    }

    const users = await db
      .select({
        id: testUsers.id,
        name: testUsers.name,
        email: testUsers.email,
        role: testUsers.role,
        categoryId: testUsers.categoryId,
        businessAreaId: testUsers.businessAreaId,
        tasksExecuted: testUsers.tasksExecuted,
        lastActiveAt: testUsers.lastActiveAt,
        isActive: testUsers.isActive,
        createdAt: testUsers.createdAt
      })
      .from(testUsers)
      .where(eq(testUsers.testOrganizationId, activeSession.testOrganizationId))
      .orderBy(desc(testUsers.createdAt));

    return users;
  }),

  // Simulierten Test-User erstellen
  createTestUser: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      role: z.enum(["admin", "member"]).default("member"),
      categoryId: z.number().optional(),
      businessAreaId: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isOwner(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können Test-User erstellen" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Aktive Test-Session finden
      const [activeSession] = await db
        .select()
        .from(testSessions)
        .where(and(
          eq(testSessions.ownerUserId, ctx.user.id),
          eq(testSessions.isActive, 1)
        ))
        .limit(1);

      if (!activeSession?.testOrganizationId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kein aktiver Testraum. Bitte zuerst Test-Modus aktivieren." });
      }

      // Fake E-Mail generieren wenn nicht angegeben
      const email = input.email || `${input.name.toLowerCase().replace(/\s+/g, '.')}@test.ki2go.local`;

      const [result] = await db.insert(testUsers).values({
        createdByOwnerId: ctx.user.id,
        testOrganizationId: activeSession.testOrganizationId,
        name: input.name,
        email,
        role: input.role,
        categoryId: input.categoryId || null,
        businessAreaId: input.businessAreaId || null,
        isActive: 1
      });

      return {
        success: true,
        testUserId: result.insertId,
        message: `Test-User "${input.name}" erstellt`
      };
    }),

  // Test-User aktualisieren
  updateTestUser: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      role: z.enum(["admin", "member"]).optional(),
      categoryId: z.number().nullable().optional(),
      businessAreaId: z.number().nullable().optional(),
      isActive: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!isOwner(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können Test-User bearbeiten" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updateData } = input;

      await db
        .update(testUsers)
        .set(updateData)
        .where(and(
          eq(testUsers.id, id),
          eq(testUsers.createdByOwnerId, ctx.user.id)
        ));

      return { success: true };
    }),

  // Test-User löschen
  deleteTestUser: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!isOwner(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können Test-User löschen" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .delete(testUsers)
        .where(and(
          eq(testUsers.id, input.id),
          eq(testUsers.createdByOwnerId, ctx.user.id)
        ));

      return { success: true };
    }),

  // ==================== TEST-DATEN MANAGEMENT ====================

  // Alle Test-Daten zurücksetzen
  resetTestData: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isOwner(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Nur Owner können Test-Daten zurücksetzen" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Alle Test-User des Owners löschen
    await db
      .delete(testUsers)
      .where(eq(testUsers.createdByOwnerId, ctx.user.id));

    // Alle Test-Sessions des Owners löschen
    await db
      .delete(testSessions)
      .where(eq(testSessions.ownerUserId, ctx.user.id));

    return { success: true, message: "Alle Test-Daten wurden zurückgesetzt" };
  }),

  // ==================== HILFSDATEN ====================

  // Kategorien für Dropdown
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.isActive, 1));
  }),

  // Unternehmensbereiche für Dropdown
  getBusinessAreas: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select({ id: businessAreas.id, name: businessAreas.name })
      .from(businessAreas)
      .where(eq(businessAreas.isActive, 1));
  }),

  // Verfügbare Pakete für Simulation
  getAvailablePlans: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select({
        id: subscriptionPlans.id,
        name: subscriptionPlans.name,
        userLimit: subscriptionPlans.userLimit,
        creditLimit: subscriptionPlans.creditLimit
      })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, 1));
  }),

  // Session-Historie
  getSessionHistory: protectedProcedure.query(async ({ ctx }) => {
    if (!isOwner(ctx.user.role)) {
      return [];
    }

    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(testSessions)
      .where(eq(testSessions.ownerUserId, ctx.user.id))
      .orderBy(desc(testSessions.startedAt))
      .limit(20);
  })
});
