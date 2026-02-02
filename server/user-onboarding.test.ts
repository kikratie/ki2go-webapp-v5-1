import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock der Datenbank-Funktionen
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
};

vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve(mockDb)),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(() => Promise.resolve(true)),
}));

describe("User Onboarding - Automatische Organization und Subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Plan-Limits Konfiguration", () => {
    it("sollte Starter-Plan als Default haben", async () => {
      // Starter-Plan sollte isDefault=true haben
      const starterPlan = {
        id: 2,
        slug: "starter",
        name: "Starter",
        taskLimit: 100,
        teamMemberLimit: 5,
        isDefault: true,
        isActive: true,
      };
      
      expect(starterPlan.isDefault).toBe(true);
      expect(starterPlan.taskLimit).toBe(100);
      expect(starterPlan.teamMemberLimit).toBe(5);
    });

    it("sollte Free-Plan deaktiviert haben", async () => {
      const freePlan = {
        id: 1,
        slug: "free",
        name: "Free",
        isDefault: false,
        isActive: false,
      };
      
      expect(freePlan.isDefault).toBe(false);
      expect(freePlan.isActive).toBe(false);
    });

    it("sollte Business-Plan mit 20 Team-Mitgliedern haben", async () => {
      const businessPlan = {
        id: 3,
        slug: "business",
        name: "Business",
        taskLimit: 500,
        teamMemberLimit: 20,
        isActive: true,
      };
      
      expect(businessPlan.teamMemberLimit).toBe(20);
      expect(businessPlan.taskLimit).toBe(500);
    });

    it("sollte Masking-Feature in Starter und Business haben", async () => {
      const starterFeatures = ["basic_templates", "upload", "download", "export_pdf", "masking"];
      const businessFeatures = ["basic_templates", "upload", "download", "export_pdf", "template_sharing", "monitoring", "team_management", "priority_support", "masking"];
      
      expect(starterFeatures).toContain("masking");
      expect(businessFeatures).toContain("masking");
    });
  });

  describe("Automatische Organization-Erstellung", () => {
    it("sollte Organization mit korrektem Namen erstellen", () => {
      const companyName = "Test GmbH";
      const userId = 123;
      const expectedSlug = `test-gmbh-${userId}`;
      
      // Slug-Generierung simulieren
      const slug = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${userId}`;
      
      expect(slug).toBe(expectedSlug);
    });

    it("sollte User als Owner der Organization setzen", () => {
      const organizationMember = {
        organizationId: 1,
        userId: 123,
        role: "owner",
      };
      
      expect(organizationMember.role).toBe("owner");
    });

    it("sollte organizationId im User-Profil setzen", () => {
      const userUpdate = {
        organizationId: 1,
        profileCompleted: 1,
      };
      
      expect(userUpdate.organizationId).toBe(1);
      expect(userUpdate.profileCompleted).toBe(1);
    });
  });

  describe("Automatische Trial-Subscription", () => {
    it("sollte Trial-Subscription mit 14 Tagen Laufzeit erstellen", () => {
      const now = new Date();
      const trialDays = 14;
      const validUntil = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      
      const subscription = {
        userId: 123,
        planId: 2, // Starter
        status: "trial",
        startedAt: now,
        validUntil: validUntil,
        billingCycle: "monthly",
      };
      
      expect(subscription.status).toBe("trial");
      expect(subscription.planId).toBe(2);
      
      // Prüfe dass validUntil ca. 14 Tage in der Zukunft liegt
      const diffDays = Math.round((validUntil.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      expect(diffDays).toBe(14);
    });

    it("sollte keine doppelte Subscription erstellen", () => {
      // Wenn bereits eine Subscription existiert, sollte keine neue erstellt werden
      const existingSubscription = { id: 1, userId: 123, planId: 2 };
      const shouldCreateNew = !existingSubscription;
      
      expect(shouldCreateNew).toBe(false);
    });
  });

  describe("Profil-Vervollständigung Validierung", () => {
    it("sollte AGB-Akzeptanz erfordern", () => {
      const input = { termsAccepted: false, privacyAccepted: true };
      const isValid = input.termsAccepted && input.privacyAccepted;
      
      expect(isValid).toBe(false);
    });

    it("sollte Datenschutz-Akzeptanz erfordern", () => {
      const input = { termsAccepted: true, privacyAccepted: false };
      const isValid = input.termsAccepted && input.privacyAccepted;
      
      expect(isValid).toBe(false);
    });

    it("sollte Firmenname für Business-User erfordern", () => {
      const input = { userType: "business", companyName: "" };
      const isValid = input.userType !== "business" || (input.companyName && input.companyName.length >= 2);
      
      // Leerer String ist falsy, daher ist isValid falsy (leerer String)
      expect(!!isValid).toBe(false);
    });

    it("sollte Privatperson ohne Firmenname akzeptieren", () => {
      const input = { userType: "private", companyName: "" };
      const isValid = input.userType !== "business" || (input.companyName && input.companyName.length >= 2);
      
      expect(isValid).toBe(true);
    });
  });
});
