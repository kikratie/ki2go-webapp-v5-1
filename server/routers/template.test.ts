import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock getDb
vi.mock("../db", () => ({
  getDb: vi.fn(() => Promise.resolve({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
          orderBy: vi.fn(() => Promise.resolve([])),
        })),
        leftJoin: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => Promise.resolve([])),
            })),
          })),
        })),
        orderBy: vi.fn(() => Promise.resolve([])),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve([{ insertId: 1 }])),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  })),
}));

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

describe("template router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("allows admin to list templates", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Should not throw for admin
      const result = await caller.template.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("denies regular user from listing templates", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.template.list()).rejects.toThrow("Admin-Rechte");
    });
  });

  describe("listActive", () => {
    it("allows public access to active templates", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      // Should not throw for public access
      const result = await caller.template.listActive();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("create", () => {
    it("allows admin to create template", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.template.create({
        slug: "test_template",
        name: "Test Template",
        title: "Test Template Title",
        createdByName: "Admin User",
      });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("slug", "test_template");
    });

    it("denies regular user from creating template", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.template.create({
          slug: "test_template",
          name: "Test Template",
          title: "Test Template Title",
          createdByName: "Regular User",
        })
      ).rejects.toThrow("Admin-Rechte");
    });

    it("validates slug format", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.template.create({
          slug: "Invalid Slug!",
          name: "Test",
          title: "Test",
          createdByName: "Admin User",
        })
      ).rejects.toThrow();
    });

    it("uses fallback for createdByName when not provided", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // createdByName ist jetzt optional - es wird ctx.user.name als Fallback verwendet
      const result = await caller.template.create({
        slug: "test_no_author",
        name: "Test",
        title: "Test",
        // createdByName fehlt absichtlich - sollte trotzdem funktionieren
      } as any);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('slug', 'test_no_author');
    });
  });

  describe("toggleStatus", () => {
    it("allows admin to change template status", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.template.toggleStatus({
        id: 1,
        status: "active",
      });

      expect(result).toEqual({ success: true });
    });

    it("denies regular user from changing status", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.template.toggleStatus({ id: 1, status: "active" })
      ).rejects.toThrow("Admin-Rechte");
    });
  });

  describe("variable schema validation", () => {
    it("validates variable key format", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.template.create({
          slug: "test_template",
          name: "Test",
          title: "Test",
          createdByName: "Admin User",
          variableSchema: [
            {
              key: "Invalid-Key",
              label: "Test",
              type: "text",
              required: false,
            },
          ],
        })
      ).rejects.toThrow();
    });

    it("accepts valid variable schema", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.template.create({
        slug: "test_with_vars",
        name: "Test with Variables",
        title: "Test",
        createdByName: "Admin User",
        variableSchema: [
          {
            key: "document_type",
            label: "Document Type",
            type: "select",
            required: true,
            options: ["Contract", "Invoice", "Report"],
          },
          {
            key: "file_upload",
            label: "Upload File",
            type: "file",
            required: false,
          },
        ],
      });

      expect(result).toHaveProperty("id");
    });
  });
});
