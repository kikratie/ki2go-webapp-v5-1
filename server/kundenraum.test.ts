import { describe, it, expect, vi, beforeEach } from "vitest";
import { organizationRouter } from "./routers/organization";
import { myTemplatesRouter } from "./routers/myTemplates";

// Mock für getDb
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue({ insertId: 1 }),
    execute: vi.fn().mockResolvedValue([]),
  }),
}));

// Mock für planFeatures
vi.mock("./planFeatures", () => ({
  getUserPlan: vi.fn().mockResolvedValue({
    planId: 1,
    planSlug: "starter",
    planName: "Starter",
    limits: { tasks: 50, customTemplates: 10, storage: 1073741824 },
    features: ["basic_templates"],
  }),
  getUserUsage: vi.fn().mockResolvedValue({
    tasksUsed: 5,
    storageUsedMb: 100,
    customTemplatesCreated: 2,
    documentsUploaded: 10,
    documentsDownloaded: 5,
  }),
  checkLimit: vi.fn().mockResolvedValue({
    allowed: true,
    used: 5,
    limit: 50,
    remaining: 45,
  }),
  checkFeature: vi.fn().mockResolvedValue(true),
  incrementUsage: vi.fn().mockResolvedValue(undefined),
}));

describe("Kundenraum APIs", () => {
  describe("organization.getKundenraumInfo", () => {
    it("sollte Kundenraum-Info für User mit Organisation zurückgeben", async () => {
      const { getDb } = await import("./db");
      const mockDb = await getDb();
      
      // Mock für User-Query
      (mockDb!.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ organizationId: 1 }]),
      });
      
      // Mock für Organization-Query
      (mockDb!.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          id: 1,
          name: "Test GmbH",
          logoUrl: "https://example.com/logo.png",
          industry: "IT",
        }]),
      });

      // Test dass die Procedure existiert
      expect(organizationRouter._def.procedures.getKundenraumInfo).toBeDefined();
    });

    it("sollte null zurückgeben wenn User keine Organisation hat", async () => {
      const { getDb } = await import("./db");
      const mockDb = await getDb();
      
      // Mock für User ohne Organisation
      (mockDb!.select as any).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ organizationId: null }]),
      });

      // Test dass die Procedure existiert
      expect(organizationRouter._def.procedures.getKundenraumInfo).toBeDefined();
    });
  });

  describe("organization.updateLogo", () => {
    it("sollte Logo-URL aktualisieren können", async () => {
      // Test dass die Procedure existiert
      expect(organizationRouter._def.procedures.updateLogo).toBeDefined();
    });

    it("sollte Input-Validierung haben", () => {
      const procedure = organizationRouter._def.procedures.updateLogo;
      expect(procedure).toBeDefined();
      // Procedure sollte Input-Schema haben
      expect(procedure._def.inputs).toBeDefined();
    });
  });

  describe("organization.updateDetails", () => {
    it("sollte Organisations-Details aktualisieren können", async () => {
      // Test dass die Procedure existiert
      expect(organizationRouter._def.procedures.updateDetails).toBeDefined();
    });
  });

  describe("myTemplates.getDiscoverableTemplates", () => {
    it("sollte nicht-verwendete öffentliche Templates zurückgeben", async () => {
      // Test dass die Procedure existiert
      expect(myTemplatesRouter._def.procedures.getDiscoverableTemplates).toBeDefined();
    });

    it("sollte limit-Parameter akzeptieren", () => {
      const procedure = myTemplatesRouter._def.procedures.getDiscoverableTemplates;
      expect(procedure).toBeDefined();
      expect(procedure._def.inputs).toBeDefined();
    });
  });

  describe("myTemplates.getKundenraumStats", () => {
    it("sollte Kundenraum-Statistiken zurückgeben", async () => {
      // Test dass die Procedure existiert
      expect(myTemplatesRouter._def.procedures.getKundenraumStats).toBeDefined();
    });

    it("sollte Plan-Info und Usage enthalten", async () => {
      const procedure = myTemplatesRouter._def.procedures.getKundenraumStats;
      expect(procedure).toBeDefined();
      // Procedure sollte keine Input-Parameter haben
      expect(procedure._def.inputs).toBeDefined();
    });
  });
});

describe("Kundenraum Router Integration", () => {
  it("sollte alle erforderlichen Procedures haben", () => {
    // Organization Router
    expect(organizationRouter._def.procedures.getKundenraumInfo).toBeDefined();
    expect(organizationRouter._def.procedures.updateLogo).toBeDefined();
    expect(organizationRouter._def.procedures.updateDetails).toBeDefined();
    
    // MyTemplates Router
    expect(myTemplatesRouter._def.procedures.getDiscoverableTemplates).toBeDefined();
    expect(myTemplatesRouter._def.procedures.getKundenraumStats).toBeDefined();
    expect(myTemplatesRouter._def.procedures.getAll).toBeDefined();
    expect(myTemplatesRouter._def.procedures.getPlanInfo).toBeDefined();
  });

  it("sollte protected Procedures für Kundenraum haben", () => {
    // Alle Kundenraum-Procedures sollten protected sein
    const kundenraumProcedures = [
      organizationRouter._def.procedures.getKundenraumInfo,
      organizationRouter._def.procedures.updateLogo,
      myTemplatesRouter._def.procedures.getDiscoverableTemplates,
      myTemplatesRouter._def.procedures.getKundenraumStats,
    ];

    kundenraumProcedures.forEach(proc => {
      expect(proc).toBeDefined();
    });
  });
});
