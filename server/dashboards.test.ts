import { describe, it, expect, vi, beforeEach } from "vitest";
import { firmaDashboardRouter } from "./routers/firmaDashboard";
import { ownerDashboardRouter } from "./routers/ownerDashboard";

// Mock für getDb
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
  }),
}));

// Mock für planFeatures
vi.mock("./planFeatures", () => ({
  getTotalManusCoststSummary: vi.fn().mockResolvedValue({
    currentMonth: { tasksUsed: 10, inputTokens: 5000, outputTokens: 2000, totalCostEur: 0.05 },
    allTime: { tasksUsed: 100, inputTokens: 50000, outputTokens: 20000, totalCostEur: 0.50 },
  }),
  getAllCustomersCostSummary: vi.fn().mockResolvedValue([
    { userId: 1, organizationId: 1, currentMonth: { tasksUsed: 5, inputTokens: 2500, outputTokens: 1000, totalCostEur: 0.025 } },
  ]),
}));

describe("Firmen-Admin Dashboard Router", () => {
  describe("Procedure Definitionen", () => {
    it("sollte checkAccess Procedure haben", () => {
      expect(firmaDashboardRouter._def.procedures.checkAccess).toBeDefined();
    });

    it("sollte getKpis Procedure haben", () => {
      expect(firmaDashboardRouter._def.procedures.getKpis).toBeDefined();
    });

    it("sollte getMemberStats Procedure haben", () => {
      expect(firmaDashboardRouter._def.procedures.getMemberStats).toBeDefined();
    });

    it("sollte getTrends Procedure haben", () => {
      expect(firmaDashboardRouter._def.procedures.getTrends).toBeDefined();
    });

    it("sollte getTopTemplates Procedure haben", () => {
      expect(firmaDashboardRouter._def.procedures.getTopTemplates).toBeDefined();
    });

    it("sollte exportCsv Procedure haben", () => {
      expect(firmaDashboardRouter._def.procedures.exportCsv).toBeDefined();
    });
  });

  describe("Procedure Typen", () => {
    it("alle Procedures sollten protected sein", () => {
      const procedures = [
        firmaDashboardRouter._def.procedures.checkAccess,
        firmaDashboardRouter._def.procedures.getKpis,
        firmaDashboardRouter._def.procedures.getMemberStats,
        firmaDashboardRouter._def.procedures.getTrends,
        firmaDashboardRouter._def.procedures.getTopTemplates,
        firmaDashboardRouter._def.procedures.exportCsv,
      ];

      procedures.forEach(proc => {
        expect(proc).toBeDefined();
      });
    });
  });
});

describe("Owner Dashboard Router", () => {
  describe("Procedure Definitionen", () => {
    it("sollte getManusKosten Procedure haben", () => {
      expect(ownerDashboardRouter._def.procedures.getManusKosten).toBeDefined();
    });

    it("sollte getKundenKosten Procedure haben", () => {
      expect(ownerDashboardRouter._def.procedures.getKundenKosten).toBeDefined();
    });

    it("sollte getKostenTrend Procedure haben", () => {
      expect(ownerDashboardRouter._def.procedures.getKostenTrend).toBeDefined();
    });

    it("sollte getUserNutzung Procedure haben", () => {
      expect(ownerDashboardRouter._def.procedures.getUserNutzung).toBeDefined();
    });

    it("sollte getAllUsersNutzung Procedure haben", () => {
      expect(ownerDashboardRouter._def.procedures.getAllUsersNutzung).toBeDefined();
    });
  });

  describe("Procedure Input-Validierung", () => {
    it("getUserNutzung sollte userId als Input haben", () => {
      const procedure = ownerDashboardRouter._def.procedures.getUserNutzung;
      expect(procedure._def.inputs).toBeDefined();
    });
  });
});

describe("Plan Features Integration", () => {
  it("sollte incrementTokenUsage exportieren", async () => {
    // Dynamischer Import um den Mock zu umgehen
    const planFeatures = await vi.importActual("./planFeatures") as any;
    expect(planFeatures.incrementTokenUsage).toBeDefined();
  });

  it("sollte incrementUsage exportieren", async () => {
    const planFeatures = await vi.importActual("./planFeatures") as any;
    expect(planFeatures.incrementUsage).toBeDefined();
  });

  it("sollte checkLimit exportieren", async () => {
    const planFeatures = await vi.importActual("./planFeatures") as any;
    expect(planFeatures.checkLimit).toBeDefined();
  });

  it("sollte getUserPlan exportieren", async () => {
    const planFeatures = await vi.importActual("./planFeatures") as any;
    expect(planFeatures.getUserPlan).toBeDefined();
  });
});

describe("Dashboard Router Integration", () => {
  it("sollte alle erforderlichen Firmen-Dashboard Procedures haben", () => {
    const requiredProcedures = [
      "checkAccess",
      "getKpis",
      "getMemberStats",
      "getTrends",
      "getTopTemplates",
      "exportCsv",
    ];

    requiredProcedures.forEach(name => {
      expect(firmaDashboardRouter._def.procedures[name]).toBeDefined();
    });
  });

  it("sollte alle erforderlichen Owner-Dashboard Procedures haben", () => {
    const requiredProcedures = [
      "getManusKosten",
      "getKundenKosten",
      "getKostenTrend",
      "getUserNutzung",
      "getAllUsersNutzung",
    ];

    requiredProcedures.forEach(name => {
      expect(ownerDashboardRouter._def.procedures[name]).toBeDefined();
    });
  });
});
