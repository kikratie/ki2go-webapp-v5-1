import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { taskTemplates, customSuperprompts, customSuperpromptHistory } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("CustomSuperprompt updateFull", () => {
  let db: any;
  let testTemplateId: number;
  let testCustomTemplateId: number;

  // Owner context
  const ownerContext = {
    user: {
      id: 1,
      openId: "owner-123",
      name: "Test Owner",
      role: "owner" as const,
      organizationId: null,
    },
  };

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Erstelle Test-Template
    const templateResult = await db.insert(taskTemplates).values({
      slug: "test-updatefull-" + Date.now(),
      name: "Test Template für updateFull",
      title: "Test Template",
      superprompt: "Test Superprompt {{VARIABLE_1}}",
      isActive: 1,
      createdBy: 1,
      variableSchema: JSON.stringify([{ key: "VARIABLE_1", label: "Variable 1", type: "text", required: true }]),
      status: "active",
    });
    testTemplateId = Number(templateResult[0].insertId);

    // Erstelle Custom-Template
    const customResult = await db.insert(customSuperprompts).values({
      baseTemplateId: testTemplateId,
      name: "Test Custom Template",
      superprompt: "Custom Superprompt {{VARIABLE_1}}",
      createdBy: 1,
      isActive: 1,
      version: 1,
    });
    testCustomTemplateId = Number(customResult[0].insertId);
  });

  afterEach(async () => {
    if (db && testCustomTemplateId) {
      await db.delete(customSuperpromptHistory).where(eq(customSuperpromptHistory.customSuperpromptId, testCustomTemplateId));
      await db.delete(customSuperprompts).where(eq(customSuperprompts.id, testCustomTemplateId));
    }
    if (db && testTemplateId) {
      await db.delete(taskTemplates).where(eq(taskTemplates.id, testTemplateId));
    }
  });

  it("sollte alle Grunddaten aktualisieren", async () => {
    const caller = appRouter.createCaller(ownerContext);
    
    const result = await caller.customSuperprompt.updateFull({
      id: testCustomTemplateId,
      name: "Aktualisierter Name",
      title: "Neuer Titel",
      description: "Neue Beschreibung",
      shortDescription: "Kurze Beschreibung",
    });
    
    expect(result.success).toBe(true);
    expect(result.newVersion).toBe(2);
  });

  it("sollte ROI-Felder aktualisieren", async () => {
    const caller = appRouter.createCaller(ownerContext);
    
    const result = await caller.customSuperprompt.updateFull({
      id: testCustomTemplateId,
      roiBaseTimeMinutes: 45,
      roiTimePerDocumentMinutes: 20,
      roiKi2goTimeMinutes: 5,
      roiHourlyRate: 100,
    });
    
    expect(result.success).toBe(true);
    
    // Verifiziere die Änderungen
    const updated = await caller.customSuperprompt.getForEdit({ id: testCustomTemplateId });
    expect(updated.roiBaseTimeMinutes).toBe(45);
    expect(updated.roiTimePerDocumentMinutes).toBe(20);
    expect(updated.roiKi2goTimeMinutes).toBe(5);
    expect(updated.roiHourlyRate).toBe(100);
  });

  it("sollte Marketing-Felder aktualisieren", async () => {
    const caller = appRouter.createCaller(ownerContext);
    
    const result = await caller.customSuperprompt.updateFull({
      id: testCustomTemplateId,
      marketingEnabled: 1,
      marketingHeadline: "Tolle Headline",
      marketingSubheadline: "Noch bessere Subheadline",
      marketingUsps: ["USP 1", "USP 2", "USP 3"],
      marketingCtaText: "Jetzt testen",
    });
    
    expect(result.success).toBe(true);
    
    // Verifiziere die Änderungen
    const updated = await caller.customSuperprompt.getForEdit({ id: testCustomTemplateId });
    expect(updated.marketingEnabled).toBe(1);
    expect(updated.marketingHeadline).toBe("Tolle Headline");
    expect(updated.marketingUsps).toEqual(["USP 1", "USP 2", "USP 3"]);
  });

  it("sollte Variablen-Schema aktualisieren", async () => {
    const caller = appRouter.createCaller(ownerContext);
    
    const newSchema = [
      { name: "VARIABLE_1", label: "Erste Variable", type: "text" as const, required: true },
      { name: "VARIABLE_2", label: "Zweite Variable", type: "textarea" as const, required: false },
    ];
    
    const result = await caller.customSuperprompt.updateFull({
      id: testCustomTemplateId,
      variableSchema: newSchema,
    });
    
    expect(result.success).toBe(true);
    
    // Verifiziere die Änderungen
    const updated = await caller.customSuperprompt.getForEdit({ id: testCustomTemplateId });
    expect(updated.variableSchema).toHaveLength(2);
  });

  it("sollte Superprompt aktualisieren und History erstellen", async () => {
    const caller = appRouter.createCaller(ownerContext);
    
    const newSuperprompt = "Neuer Superprompt mit {{VARIABLE_1}} und {{VARIABLE_2}}";
    
    const result = await caller.customSuperprompt.updateFull({
      id: testCustomTemplateId,
      superprompt: newSuperprompt,
      changeLog: "Superprompt komplett überarbeitet",
    });
    
    expect(result.success).toBe(true);
    
    // Verifiziere die Änderungen
    const updated = await caller.customSuperprompt.getForEdit({ id: testCustomTemplateId });
    expect(updated.superprompt).toBe(newSuperprompt);
    expect(updated.history.length).toBeGreaterThan(0);
  });

  it("sollte Fehler werfen bei nicht existierendem Template", async () => {
    const caller = appRouter.createCaller(ownerContext);
    
    await expect(
      caller.customSuperprompt.updateFull({
        id: 999999,
        name: "Test",
      })
    ).rejects.toThrow();
  });
});
