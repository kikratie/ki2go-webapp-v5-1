import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("metaprompt router", () => {
  describe("list", () => {
    it("should return list of metaprompts for admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.metaprompt.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return list of metaprompts for regular user", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.metaprompt.list();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getDefault", () => {
    it("should return default metaprompt or null", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.metaprompt.getDefault();

      // Result can be null if no default metaprompt exists
      expect(result === null || typeof result === "object").toBe(true);
    });
  });

  describe("create", () => {
    it("should require admin role to create metaprompt", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.metaprompt.create({
          name: "Test Metaprompt",
          template: "Test content {{VARIABLE}}",
        })
      ).rejects.toThrow();
    });
  });

  describe("generateSuperprompt", () => {
    it("should require task description", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.metaprompt.generateSuperprompt({
          taskDescription: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("extractVariables", () => {
    it("should extract variables from superprompt text", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.metaprompt.extractVariables({
        text: "Analysiere {{DOKUMENT}} und prüfe {{VERTRAGSTYP}} auf Risiken.",
      });

      expect(result.schema).toBeDefined();
      expect(Array.isArray(result.schema)).toBe(true);
      expect(result.schema.length).toBe(2);
      expect(result.schema.some((v: any) => v.key === "DOKUMENT")).toBe(true);
      expect(result.schema.some((v: any) => v.key === "VERTRAGSTYP")).toBe(true);
    });

    it("should return empty array for text without variables", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.metaprompt.extractVariables({
        text: "Ein Text ohne Variablen.",
      });

      expect(result.schema).toBeDefined();
      expect(Array.isArray(result.schema)).toBe(true);
      expect(result.schema.length).toBe(0);
    });

    it("should handle duplicate variables", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.metaprompt.extractVariables({
        text: "{{NAME}} ist {{NAME}} und {{ALTER}}.",
      });

      expect(result.schema.length).toBe(2); // NAME should appear only once
      expect(result.schema.filter((v: any) => v.key === "NAME").length).toBe(1);
    });
  });
});
