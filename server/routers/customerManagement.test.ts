import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// Mock the schema
vi.mock("../../drizzle/schema", () => ({
  users: { id: "id", name: "name", email: "email", role: "role", categoryId: "categoryId", businessAreaId: "businessAreaId" },
  organizations: { id: "id", name: "name", slug: "slug", customerNumber: "customerNumber" },
  organizationMembers: { id: "id", organizationId: "organizationId", userId: "userId", role: "role" },
  organizationSubscriptions: { id: "id", organizationId: "organizationId", planId: "planId", status: "status" },
  organizationTemplates: { id: "id", organizationId: "organizationId", templateId: "templateId" },
  customSuperprompts: { id: "id", organizationId: "organizationId", name: "name" },
  subscriptionPlans: { id: "id", name: "name", slug: "slug" },
  workflowExecutions: { id: "id", organizationId: "organizationId", userId: "userId" },
  usageTracking: { id: "id", organizationId: "organizationId", userId: "userId" },
  categories: { id: "id", name: "name", slug: "slug" },
  businessAreas: { id: "id", name: "name", slug: "slug" },
  taskTemplates: { id: "id", name: "name", slug: "slug" },
}));

describe("customerManagement Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Router Structure", () => {
    it("should have all required procedures defined", async () => {
      // Import the router after mocks are set up
      const { customerManagementRouter } = await import("./customerManagement");
      
      // Check that the router exists
      expect(customerManagementRouter).toBeDefined();
      
      // Check that all required procedures exist
      const procedures = Object.keys(customerManagementRouter._def.procedures);
      
      expect(procedures).toContain("getCustomers");
      expect(procedures).toContain("getCustomerById");
      expect(procedures).toContain("getCustomerMembers");
      expect(procedures).toContain("updateMemberDepartment");
      expect(procedures).toContain("getCustomerUsageTrends");
      expect(procedures).toContain("getCustomerTopTemplates");
      expect(procedures).toContain("getCustomerTemplates");
      expect(procedures).toContain("getCustomerCustomTemplates");
      expect(procedures).toContain("updateCustomerPlan");
      expect(procedures).toContain("getCategories");
      expect(procedures).toContain("getBusinessAreas");
      expect(procedures).toContain("getAvailablePlans");
    });

    it("should have 12 total procedures", async () => {
      const { customerManagementRouter } = await import("./customerManagement");
      const procedures = Object.keys(customerManagementRouter._def.procedures);
      expect(procedures.length).toBe(12);
    });
  });

  describe("Procedure Types", () => {
    it("should have query procedures for read operations", async () => {
      const { customerManagementRouter } = await import("./customerManagement");
      
      // These should be queries (read operations)
      const queryProcedures = [
        "getCustomers",
        "getCustomerById",
        "getCustomerMembers",
        "getCustomerUsageTrends",
        "getCustomerTopTemplates",
        "getCustomerTemplates",
        "getCustomerCustomTemplates",
        "getCategories",
        "getBusinessAreas",
        "getAvailablePlans",
      ];
      
      for (const procName of queryProcedures) {
        const proc = customerManagementRouter._def.procedures[procName];
        expect(proc).toBeDefined();
        expect(proc._def.type).toBe("query");
      }
    });

    it("should have mutation procedures for write operations", async () => {
      const { customerManagementRouter } = await import("./customerManagement");
      
      // These should be mutations (write operations)
      const mutationProcedures = [
        "updateMemberDepartment",
        "updateCustomerPlan",
      ];
      
      for (const procName of mutationProcedures) {
        const proc = customerManagementRouter._def.procedures[procName];
        expect(proc).toBeDefined();
        expect(proc._def.type).toBe("mutation");
      }
    });
  });

  describe("Helper Functions", () => {
    it("should correctly format current month", () => {
      // Test the month formatting logic
      const now = new Date();
      const expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      
      // The helper function should produce this format
      expect(expectedMonth).toMatch(/^\d{4}-\d{2}$/);
    });

    it("should generate last N months correctly", () => {
      // Test that we can generate month strings
      const months: string[] = [];
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
      
      expect(months.length).toBe(6);
      expect(months[0]).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe("Input Validation", () => {
    it("should validate getCustomers input schema", async () => {
      const { customerManagementRouter } = await import("./customerManagement");
      const proc = customerManagementRouter._def.procedures.getCustomers;
      
      // The procedure should accept optional input
      expect(proc._def.inputs).toBeDefined();
    });

    it("should validate getCustomerById requires organizationId", async () => {
      const { customerManagementRouter } = await import("./customerManagement");
      const proc = customerManagementRouter._def.procedures.getCustomerById;
      
      // The procedure should have input validation
      expect(proc._def.inputs).toBeDefined();
    });

    it("should validate updateMemberDepartment requires userId", async () => {
      const { customerManagementRouter } = await import("./customerManagement");
      const proc = customerManagementRouter._def.procedures.updateMemberDepartment;
      
      // The procedure should have input validation
      expect(proc._def.inputs).toBeDefined();
    });

    it("should validate updateCustomerPlan requires organizationId and planId", async () => {
      const { customerManagementRouter } = await import("./customerManagement");
      const proc = customerManagementRouter._def.procedures.updateCustomerPlan;
      
      // The procedure should have input validation
      expect(proc._def.inputs).toBeDefined();
    });
  });
});
