import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { taskTemplates, workflowExecutions, workflowFeedback, organizations, organizationTemplates, organizationMembers } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "# Analyseergebnis\n\nDies ist ein Test-Ergebnis." } }],
    usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
  }),
}));

// Mock planFeatures - Tests sollen immer erlaubt sein
vi.mock("./planFeatures", () => ({
  checkLimit: vi.fn().mockResolvedValue({ allowed: true, used: 0, limit: 100, remaining: 100 }),
  incrementUsage: vi.fn().mockResolvedValue(true),
  incrementTokenUsage: vi.fn().mockResolvedValue(true),
  checkFeature: vi.fn().mockResolvedValue(true),
  getUserPlan: vi.fn().mockResolvedValue({
    planId: 1,
    planSlug: "free",
    planName: "Free",
    status: "active",
    features: ["tasks", "document_upload"],
    limits: { tasks: 100, customTemplates: 5, storage: 100, teamMembers: 3 },
    validUntil: null,
  }),
}));

describe("Workflow Router", () => {
  let db: any;
  let testTemplateId: number;
  let testOrgId: number;
  
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

  // Member context
  const memberContext = {
    user: {
      id: 2,
      openId: "member-123",
      name: "Test Member",
      role: "member" as const,
      organizationId: 1,
    },
  };

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Erstelle Test-Organisation
    const orgResult = await db.insert(organizations).values({
      name: "Test Organisation",
      slug: "test-org-" + Date.now(),
      ownerId: 1, // Owner ID
    });
    testOrgId = Number(orgResult[0].insertId);

    // Erstelle Test-Template
    const templateResult = await db.insert(taskTemplates).values({
      slug: "test-workflow-" + Date.now(),
      name: "Test Workflow",
      title: "Test Workflow Template",
      shortDescription: "Ein Test-Template für Workflow-Tests",
      superprompt: "Analysiere den folgenden Text: {{TEXT}}. Fokus: {{FOKUS}}",
      variableSchema: JSON.stringify([
        { key: "TEXT", label: "Text", type: "textarea", required: true },
        { key: "FOKUS", label: "Fokus", type: "text", required: false },
      ]),
      status: "active",
      estimatedTimeSavings: 15,
    });
    testTemplateId = Number(templateResult[0].insertId);

    // Weise Template der Organisation zu
    await db.insert(organizationTemplates).values({
      organizationId: testOrgId,
      templateId: testTemplateId,
      isActive: 1,
      assignedBy: 1,
    });

    // Update member context mit korrekter orgId
    memberContext.user.organizationId = testOrgId;
  });

  describe("getAvailableTasks", () => {
    it("sollte alle aktiven Templates für Owner zurückgeben", async () => {
      const caller = appRouter.createCaller(ownerContext);
      const tasks = await caller.workflow.getAvailableTasks();
      
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      
      const testTask = tasks.find(t => t.id === testTemplateId);
      expect(testTask).toBeDefined();
      expect(testTask?.title).toBe("Test Workflow Template");
    });

    it("sollte nur zugewiesene Templates für Member zurückgeben", async () => {
      const caller = appRouter.createCaller(memberContext);
      const tasks = await caller.workflow.getAvailableTasks();
      
      expect(Array.isArray(tasks)).toBe(true);
      
      // Member sollte nur Templates seiner Organisation sehen
      const testTask = tasks.find(t => t.id === testTemplateId);
      expect(testTask).toBeDefined();
    });

    it("sollte leere Liste für Member ohne Organisation zurückgeben", async () => {
      const noOrgContext = {
        user: {
          id: 3,
          openId: "no-org-123",
          name: "No Org User",
          role: "member" as const,
          organizationId: null,
        },
      };
      
      const caller = appRouter.createCaller(noOrgContext);
      const tasks = await caller.workflow.getAvailableTasks();
      
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(0);
    });
  });

  describe("getTemplateForExecution", () => {
    it("sollte Template mit Variablen-Schema laden", async () => {
      const caller = appRouter.createCaller(ownerContext);
      
      // Hole slug des Test-Templates
      const templates = await db
        .select({ slug: taskTemplates.slug })
        .from(taskTemplates)
        .where(eq(taskTemplates.id, testTemplateId))
        .limit(1);
      
      const template = await caller.workflow.getTemplateForExecution({ 
        slug: templates[0].slug 
      });
      
      expect(template).toBeDefined();
      expect(template.id).toBe(testTemplateId);
      expect(template.title).toBe("Test Workflow Template");
      expect(template.variableSchema).toBeDefined();
      
      const schema = typeof template.variableSchema === "string" 
        ? JSON.parse(template.variableSchema) 
        : template.variableSchema;
      expect(Array.isArray(schema)).toBe(true);
      expect(schema.length).toBe(2);
    });

    it("sollte Fehler werfen wenn Template nicht existiert", async () => {
      const caller = appRouter.createCaller(ownerContext);
      
      await expect(
        caller.workflow.getTemplateForExecution({ slug: "nicht-existierend" })
      ).rejects.toThrow();
    });
  });

  describe("execute", () => {
    it("sollte Aufgabe erfolgreich ausführen", async () => {
      const caller = appRouter.createCaller(ownerContext);
      
      const result = await caller.workflow.execute({
        templateId: testTemplateId,
        variables: {
          TEXT: "Dies ist ein Testtext für die Analyse.",
          FOKUS: "Struktur",
        },
      });
      
      expect(result).toBeDefined();
      expect(result.executionId).toBeDefined();
      expect(result.sessionId).toBeDefined();
      expect(result.result).toContain("Analyseergebnis");
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    it("sollte Fehler werfen wenn Template nicht existiert", async () => {
      const caller = appRouter.createCaller(ownerContext);
      
      await expect(
        caller.workflow.execute({
          templateId: 99999,
          variables: { TEXT: "Test" },
        })
      ).rejects.toThrow();
    });
  });

  describe("getExecution", () => {
    it("sollte Ausführung mit Ergebnis laden", async () => {
      const caller = appRouter.createCaller(ownerContext);
      
      // Führe zuerst eine Aufgabe aus
      const execResult = await caller.workflow.execute({
        templateId: testTemplateId,
        variables: { TEXT: "Test für getExecution" },
      });
      
      // Lade die Ausführung
      const execution = await caller.workflow.getExecution({
        executionId: execResult.executionId,
      });
      
      expect(execution).toBeDefined();
      expect(execution.id).toBe(execResult.executionId);
      expect(execution.result).toBeDefined();
      expect(execution.status).toBe("completed");
      expect(execution.template).toBeDefined();
      expect(execution.template?.title).toBe("Test Workflow Template");
    });
  });

  describe("getMyExecutions", () => {
    it("sollte eigene Ausführungen auflisten", async () => {
      const caller = appRouter.createCaller(ownerContext);
      
      // Führe eine Aufgabe aus
      await caller.workflow.execute({
        templateId: testTemplateId,
        variables: { TEXT: "Test für getMyExecutions" },
      });
      
      const executions = await caller.workflow.getMyExecutions({
        limit: 10,
        offset: 0,
      });
      
      expect(Array.isArray(executions)).toBe(true);
      expect(executions.length).toBeGreaterThan(0);
      expect(executions[0].templateTitle).toBeDefined();
    });
  });

  describe("submitFeedback", () => {
    it("sollte positives Feedback speichern", async () => {
      const caller = appRouter.createCaller(ownerContext);
      
      // Führe zuerst eine Aufgabe aus
      const execResult = await caller.workflow.execute({
        templateId: testTemplateId,
        variables: { TEXT: "Test für Feedback" },
      });
      
      // Gib Feedback ab
      const feedbackResult = await caller.workflow.submitFeedback({
        executionId: execResult.executionId,
        rating: "positive",
        improvementSuggestion: "Sehr hilfreich!",
      });
      
      expect(feedbackResult.success).toBe(true);
      
      // Prüfe ob Feedback gespeichert wurde
      const execution = await caller.workflow.getExecution({
        executionId: execResult.executionId,
      });
      
      expect(execution.feedback).toBeDefined();
      expect(execution.feedback?.rating).toBe("positive");
    });

    it("sollte negatives Feedback mit Verbesserungsvorschlag speichern", async () => {
      const caller = appRouter.createCaller(ownerContext);
      
      // Führe zuerst eine Aufgabe aus
      const execResult = await caller.workflow.execute({
        templateId: testTemplateId,
        variables: { TEXT: "Test für negatives Feedback" },
      });
      
      // Gib negatives Feedback ab
      const feedbackResult = await caller.workflow.submitFeedback({
        executionId: execResult.executionId,
        rating: "negative",
        feedbackCategory: "result_quality",
        improvementSuggestion: "Das Ergebnis sollte detaillierter sein.",
      });
      
      expect(feedbackResult.success).toBe(true);
    });

    it("sollte Feedback mit Kommentar und Verbesserungsvorschlag speichern", async () => {
      const caller = appRouter.createCaller(ownerContext);
      
      // Führe zuerst eine Aufgabe aus
      const execResult = await caller.workflow.execute({
        templateId: testTemplateId,
        variables: { TEXT: "Test für Feedback mit Kommentar" },
      });
      
      // Gib Feedback mit Kommentar ab
      const feedbackResult = await caller.workflow.submitFeedback({
        executionId: execResult.executionId,
        rating: "positive",
        comment: "Das Ergebnis war sehr gut strukturiert und hilfreich.",
        improvementSuggestion: "Vielleicht könnten noch mehr Beispiele hinzugefügt werden.",
      });
      
      expect(feedbackResult.success).toBe(true);
      
      // Prüfe ob Feedback mit Kommentar gespeichert wurde
      const execution = await caller.workflow.getExecution({
        executionId: execResult.executionId,
      });
      
      expect(execution.feedback).toBeDefined();
      expect(execution.feedback?.rating).toBe("positive");
      expect(execution.feedback?.comment).toBe("Das Ergebnis war sehr gut strukturiert und hilfreich.");
      expect(execution.feedback?.improvementSuggestion).toBe("Vielleicht könnten noch mehr Beispiele hinzugefügt werden.");
    });
  });

  // Cleanup nach Tests
  afterEach(async () => {
    if (db && testTemplateId) {
      // Lösche Test-Feedback
      await db.delete(workflowFeedback).where(eq(workflowFeedback.templateId, testTemplateId));
      
      // Lösche Test-Executions
      await db.delete(workflowExecutions).where(eq(workflowExecutions.templateId, testTemplateId));
      
      // Lösche Template-Zuweisung
      await db.delete(organizationTemplates).where(eq(organizationTemplates.templateId, testTemplateId));
      
      // Lösche Test-Template
      await db.delete(taskTemplates).where(eq(taskTemplates.id, testTemplateId));
      
      // Lösche Test-Organisation
      if (testOrgId) {
        await db.delete(organizations).where(eq(organizations.id, testOrgId));
      }
    }
  });
});
