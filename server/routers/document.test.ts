import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { appRouter } from "../routers";

// Mock the database
vi.mock("../db", () => ({
  getDb: vi.fn(() => ({
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve([{ insertId: 1 }])),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => Promise.resolve([])),
            })),
          })),
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  })),
}));

// Mock storage
vi.mock("../storage", () => ({
  storagePut: vi.fn(() => Promise.resolve({ 
    url: "https://s3.example.com/test.pdf", 
    key: "test-key" 
  })),
}));

describe("Document Router", () => {
  const mockUser = {
    id: "test-user-123",
    name: "Test User",
    email: "test@example.com",
    role: "user" as const,
    openId: "test-open-id",
  };

  const createCaller = (user: typeof mockUser | null = mockUser) => {
    return appRouter.createCaller({
      user,
      req: {} as any,
      res: {} as any,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("upload", () => {
    it("sollte ein TXT-Dokument hochladen können", async () => {
      const caller = createCaller();
      
      // Einfacher Text als Base64
      const textContent = "Dies ist ein Testdokument mit etwas Text für die Analyse.";
      const base64Data = Buffer.from(textContent).toString("base64");
      
      const result = await caller.document.upload({
        fileName: "test.txt",
        fileData: base64Data,
        mimeType: "text/plain",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.fileName).toBe("test.txt");
      expect(result.fileUrl).toContain("s3.example.com");
    });

    it("sollte ungültige Dateitypen ablehnen", async () => {
      const caller = createCaller();
      const base64Data = Buffer.from("test").toString("base64");

      await expect(
        caller.document.upload({
          fileName: "test.exe",
          fileData: base64Data,
          mimeType: "application/x-executable",
        })
      ).rejects.toThrow("Nur PDF, DOCX und TXT Dateien sind erlaubt");
    });

    it("sollte zu große Dateien ablehnen", async () => {
      const caller = createCaller();
      // Erstelle einen großen Base64-String (> 10MB)
      const largeData = Buffer.alloc(11 * 1024 * 1024).toString("base64");

      await expect(
        caller.document.upload({
          fileName: "large.pdf",
          fileData: largeData,
          mimeType: "application/pdf",
        })
      ).rejects.toThrow("Datei zu groß");
    });

    it("sollte ohne Authentifizierung fehlschlagen", async () => {
      const caller = createCaller(null);
      const base64Data = Buffer.from("test").toString("base64");

      await expect(
        caller.document.upload({
          fileName: "test.txt",
          fileData: base64Data,
          mimeType: "text/plain",
        })
      ).rejects.toThrow();
    });
  });

  describe("getMyDocuments", () => {
    it("sollte Dokumente des Benutzers abrufen können", async () => {
      const caller = createCaller();
      
      const result = await caller.document.getMyDocuments();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
