import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock the database functions
vi.mock("../db", () => ({
  getAllCategories: vi.fn(),
  getCategoryById: vi.fn(),
  getCategoryBySlug: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  reorderCategories: vi.fn(),
  createAdminLog: vi.fn(),
}));

import * as db from "../db";

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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("category router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns all active categories for public users", async () => {
      const mockCategories = [
        { id: 1, slug: "analyse", name: "Analyse", isActive: 1 },
        { id: 2, slug: "erstellen", name: "Erstellen", isActive: 1 },
      ];
      vi.mocked(db.getAllCategories).mockResolvedValue(mockCategories as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.category.list();

      expect(result).toEqual(mockCategories);
      expect(db.getAllCategories).toHaveBeenCalledWith(false);
    });

    it("can include inactive categories when requested", async () => {
      const mockCategories = [
        { id: 1, slug: "analyse", name: "Analyse", isActive: 1 },
        { id: 2, slug: "deleted", name: "Deleted", isActive: 0 },
      ];
      vi.mocked(db.getAllCategories).mockResolvedValue(mockCategories as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.category.list({ includeInactive: true });

      expect(result).toEqual(mockCategories);
      expect(db.getAllCategories).toHaveBeenCalledWith(true);
    });
  });

  describe("create", () => {
    it("allows admin to create a category", async () => {
      vi.mocked(db.getCategoryBySlug).mockResolvedValue(undefined);
      vi.mocked(db.createCategory).mockResolvedValue({} as any);
      vi.mocked(db.createAdminLog).mockResolvedValue(undefined);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.category.create({
        slug: "new_category",
        name: "New Category",
        description: "Test description",
      });

      expect(result.success).toBe(true);
      expect(db.createCategory).toHaveBeenCalled();
      expect(db.createAdminLog).toHaveBeenCalled();
    });

    it("rejects duplicate slugs", async () => {
      vi.mocked(db.getCategoryBySlug).mockResolvedValue({ id: 1, slug: "existing" } as any);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.category.create({
          slug: "existing",
          name: "Duplicate",
        })
      ).rejects.toThrow("Eine Kategorie mit diesem Slug existiert bereits");
    });

    it("rejects non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.category.create({
          slug: "test",
          name: "Test",
        })
      ).rejects.toThrow("Nur Administratoren haben Zugriff");
    });
  });

  describe("update", () => {
    it("allows admin to update a category", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue({ id: 1, slug: "old", name: "Old" } as any);
      vi.mocked(db.updateCategory).mockResolvedValue({} as any);
      vi.mocked(db.createAdminLog).mockResolvedValue(undefined);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.category.update({
        id: 1,
        name: "Updated Name",
      });

      expect(result.success).toBe(true);
      expect(db.updateCategory).toHaveBeenCalledWith(1, { name: "Updated Name" });
    });

    it("throws error for non-existent category", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue(undefined);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.category.update({ id: 999, name: "Test" })
      ).rejects.toThrow("Kategorie nicht gefunden");
    });
  });

  describe("delete", () => {
    it("allows admin to soft-delete a category", async () => {
      vi.mocked(db.getCategoryById).mockResolvedValue({ id: 1, slug: "test" } as any);
      vi.mocked(db.deleteCategory).mockResolvedValue({} as any);
      vi.mocked(db.createAdminLog).mockResolvedValue(undefined);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.category.delete({ id: 1 });

      expect(result.success).toBe(true);
      expect(db.deleteCategory).toHaveBeenCalledWith(1);
    });
  });
});
