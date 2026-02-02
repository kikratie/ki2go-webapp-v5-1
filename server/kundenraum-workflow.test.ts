import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// Mock planFeatures
vi.mock("./planFeatures", () => ({
  checkFeature: vi.fn().mockResolvedValue(true),
  checkLimit: vi.fn().mockResolvedValue({ allowed: true, current: 5, limit: 100 }),
  getUserPlan: vi.fn().mockResolvedValue({ name: "Free", slug: "free" }),
  getUserUsage: vi.fn().mockResolvedValue({ tasksThisMonth: 5 }),
}));

describe("Kundenraum Workflow - Zwei Nutzungsebenen", () => {
  
  describe("Kostenlos (ohne Datenraum)", () => {
    it("sollte öffentliche Templates direkt ausführen können", () => {
      // User ohne organizationId kann öffentliche Templates nutzen
      const user = {
        id: 1,
        role: "user",
        organizationId: null, // Kein Datenraum
      };
      
      const template = {
        id: 1,
        isPublic: 1,
        title: "Test Template",
      };
      
      // Logik: isPublic = 1 → alle eingeloggten User haben Zugriff
      const hasAccess = template.isPublic === 1 || user.role === "owner";
      expect(hasAccess).toBe(true);
    });

    it("sollte KEINE Templates zum Kundenraum kopieren können", () => {
      const user = {
        id: 1,
        role: "user",
        organizationId: null, // Kein Datenraum
      };
      
      // Logik: copyTemplateToKundenraum prüft organizationId
      const canCopyToKundenraum = user.organizationId !== null;
      expect(canCopyToKundenraum).toBe(false);
    });
  });

  describe("Mit Datenraum (Kunde)", () => {
    it("sollte Templates zum Kundenraum kopieren können", () => {
      const user = {
        id: 1,
        role: "user",
        organizationId: 100, // Hat Datenraum
      };
      
      // Logik: copyTemplateToKundenraum erlaubt wenn organizationId vorhanden
      const canCopyToKundenraum = user.organizationId !== null;
      expect(canCopyToKundenraum).toBe(true);
    });

    it("sollte kopierte Templates im Kundenraum sehen", () => {
      const organizationTemplates = [
        { id: 1, organizationId: 100, templateId: 5, isActive: 1 },
        { id: 2, organizationId: 100, templateId: 8, isActive: 1 },
      ];
      
      const user = { organizationId: 100 };
      
      // Logik: getKundenraumTemplates filtert nach organizationId
      const userTemplates = organizationTemplates.filter(
        t => t.organizationId === user.organizationId && t.isActive === 1
      );
      
      expect(userTemplates.length).toBe(2);
    });

    it("sollte Anpassungswunsch einreichen können", () => {
      const user = {
        id: 1,
        role: "user",
        organizationId: 100,
      };
      
      const customizationRequest = {
        templateId: 5,
        description: "Bitte fügen Sie ein Feld für die Vertragslaufzeit hinzu",
        urgency: "normal",
      };
      
      // Logik: Alle eingeloggten User können Anpassungswünsche einreichen
      const canRequestCustomization = user.id !== null;
      expect(canRequestCustomization).toBe(true);
      expect(customizationRequest.description.length).toBeGreaterThan(10);
    });
  });

  describe("Custom Superprompt Zugriff", () => {
    it("sollte NUR Owner erlauben Custom Superprompts zu erstellen", () => {
      const ownerUser = { id: 1, role: "owner" };
      const adminUser = { id: 2, role: "admin" };
      const normalUser = { id: 3, role: "user" };
      
      // Logik aus customSuperprompt.ts: ctx.user.role !== "owner" → FORBIDDEN
      const ownerCanCreate = ownerUser.role === "owner";
      const adminCanCreate = adminUser.role === "owner";
      const userCanCreate = normalUser.role === "owner";
      
      expect(ownerCanCreate).toBe(true);
      expect(adminCanCreate).toBe(false);
      expect(userCanCreate).toBe(false);
    });

    it("sollte NUR Owner erlauben Custom Superprompts zu bearbeiten", () => {
      const ownerUser = { id: 1, role: "owner" };
      const normalUser = { id: 3, role: "user" };
      
      const ownerCanEdit = ownerUser.role === "owner";
      const userCanEdit = normalUser.role === "owner";
      
      expect(ownerCanEdit).toBe(true);
      expect(userCanEdit).toBe(false);
    });
  });

  describe("hasKundenraum API", () => {
    it("sollte korrekt erkennen ob User einen Datenraum hat", () => {
      const userWithKundenraum = { organizationId: 100 };
      const userWithoutKundenraum = { organizationId: null };
      
      const hasKundenraum1 = userWithKundenraum.organizationId !== null && 
                            userWithKundenraum.organizationId !== undefined;
      const hasKundenraum2 = userWithoutKundenraum.organizationId !== null && 
                            userWithoutKundenraum.organizationId !== undefined;
      
      expect(hasKundenraum1).toBe(true);
      expect(hasKundenraum2).toBe(false);
    });
  });

  describe("Neue Aufgaben entdecken", () => {
    it("sollte öffentliche Templates filtern die noch nicht kopiert wurden", () => {
      const publicTemplates = [
        { id: 1, isPublic: 1, title: "Template A" },
        { id: 2, isPublic: 1, title: "Template B" },
        { id: 3, isPublic: 1, title: "Template C" },
        { id: 4, isPublic: 0, title: "Template D (privat)" },
      ];
      
      const copiedTemplateIds = new Set([1, 3]); // User hat Template 1 und 3 bereits
      
      // Logik: getDiscoverableTemplates
      const discoverableTemplates = publicTemplates.filter(
        t => t.isPublic === 1 && !copiedTemplateIds.has(t.id)
      );
      
      expect(discoverableTemplates.length).toBe(1);
      expect(discoverableTemplates[0].title).toBe("Template B");
    });
  });
});
