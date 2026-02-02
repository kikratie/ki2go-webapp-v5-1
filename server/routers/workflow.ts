import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  taskTemplates, 
  workflowExecutions, 
  workflowFeedback, 
  organizationTemplates,
  organizationMembers,
  documents,
  customSuperprompts
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { randomUUID } from "crypto";
import { checkLimit, incrementUsage, incrementTokenUsage } from "../planFeatures";

// Helper: Generiert eine Session-ID
const generateSessionId = () => `WF-${Date.now()}-${randomUUID().slice(0, 8)}`;

// Helper: Ersetzt Variablen im Superprompt
const replaceVariables = (superprompt: string, variables: Record<string, any>): string => {
  let result = superprompt;
  
  for (const [key, value] of Object.entries(variables)) {
    // Ersetze {{KEY}} und {{key}} (case-insensitive für den Key)
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(regex, String(value || ''));
  }
  
  return result;
};

// Helper: Prüft ob User Zugriff auf Template hat
const hasTemplateAccess = async (userId: number, templateId: number, userOrgId: number | null): Promise<boolean> => {
  const db = await getDb();
  if (!db) return false;
  
  // Wenn User keiner Organisation angehört, kein Zugriff
  if (!userOrgId) return false;
  
  // Prüfe ob Template für die Organisation freigegeben ist
  const access = await db
    .select()
    .from(organizationTemplates)
    .where(and(
      eq(organizationTemplates.organizationId, userOrgId),
      eq(organizationTemplates.templateId, templateId),
      eq(organizationTemplates.isActive, 1)
    ))
    .limit(1);
  
  return access.length > 0;
};

export const workflowRouter = router({
  // Template für Ausführung laden (mit Variablen-Schema)
  getTemplateForExecution: protectedProcedure
    .input(z.object({ 
      slug: z.string().optional(),
      id: z.number().optional()
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Finde Template
      let template;
      if (input.slug) {
        template = await db
          .select()
          .from(taskTemplates)
          .where(and(
            eq(taskTemplates.slug, input.slug),
            eq(taskTemplates.status, "active")
          ))
          .limit(1);
      } else if (input.id) {
        template = await db
          .select()
          .from(taskTemplates)
          .where(and(
            eq(taskTemplates.id, input.id),
            eq(taskTemplates.status, "active")
          ))
          .limit(1);
      } else {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Slug oder ID erforderlich" });
      }

      if (!template.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aufgabe nicht gefunden oder nicht aktiv" });
      }

      const t = template[0];

      // Prüfe Zugriff:
      // 1. Owner und Admin haben immer Zugriff
      // 2. Öffentliche Templates (isPublic=1) sind für alle zugänglich
      // 3. Sonst: Organisations-Freigabe prüfen
      const isPublicTemplate = t.isPublic === 1;
      const isAdminOrOwner = ctx.user.role === "owner" || ctx.user.role === "admin";
      
      if (!isAdminOrOwner && !isPublicTemplate) {
        const hasAccess = await hasTemplateAccess(ctx.user.id, t.id, ctx.user.organizationId || null);
        if (!hasAccess) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sie haben keinen Zugriff auf diese Aufgabe" });
        }
      }

      // Gib nur die für den User relevanten Daten zurück (kein Superprompt!)
      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        shortDescription: t.shortDescription,
        icon: t.icon,
        color: t.color,
        variableSchema: t.variableSchema || [],
        documentRequired: t.documentRequired === 1,
        documentCount: t.documentCount || 1,
        allowedFileTypes: t.allowedFileTypes || ["pdf", "docx"],
        maxFileSize: t.maxFileSize || 10485760,
        maxPages: t.maxPages,
        documentDescription: t.documentDescription,
        estimatedTimeSavings: t.estimatedTimeSavings,
        outputFormat: t.outputFormat,
        // ROI-Kalkulation
        roiBaseTimeMinutes: t.roiBaseTimeMinutes ?? 30,
        roiTimePerDocumentMinutes: t.roiTimePerDocumentMinutes ?? 15,
        roiKi2goTimeMinutes: t.roiKi2goTimeMinutes ?? 3,
        roiKi2goTimePerDocument: t.roiKi2goTimePerDocument ?? 1,
        roiHourlyRate: t.roiHourlyRate ?? 80,
        roiTasksPerMonth: t.roiTasksPerMonth ?? 10,
        roiSources: t.roiSources || [],
        // Marketing & SEO
        marketingEnabled: t.marketingEnabled ?? 0,
        marketingHeadline: t.marketingHeadline || null,
        marketingSubheadline: t.marketingSubheadline || null,
        marketingUsps: t.marketingUsps || [],
        marketingCtaText: t.marketingCtaText || null,
        marketingMetaDescription: t.marketingMetaDescription || null,
        marketingKeywords: t.marketingKeywords || [],
      };
    }),

  // Aufgabe ausführen
  execute: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      variables: z.record(z.string(), z.any()),
      documentIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const startTime = Date.now();
      const sessionId = generateSessionId();

      // Lade Template
      const template = await db
        .select()
        .from(taskTemplates)
        .where(eq(taskTemplates.id, input.templateId))
        .limit(1);

      if (!template.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Aufgabe nicht gefunden" });
      }

      const t = template[0];

      // Prüfe Zugriff:
      // 1. Owner und Admin haben immer Zugriff
      // 2. Öffentliche Templates (isPublic=1) sind für alle eingeloggten User zugänglich
      // 3. Sonst: Organisations-Freigabe prüfen
      const isPublicTemplate = t.isPublic === 1;
      const isAdminOrOwner = ctx.user.role === "owner" || ctx.user.role === "admin";
      
      if (!isAdminOrOwner && !isPublicTemplate) {
        const hasAccess = await hasTemplateAccess(ctx.user.id, t.id, ctx.user.organizationId || null);
        if (!hasAccess) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Sie haben keinen Zugriff auf diese Aufgabe" });
        }
      }

      // === FEATURE-GATE: Prüfe Task-Limit ===
      const taskLimitCheck = await checkLimit(ctx.user.id, "tasks");
      if (!taskLimitCheck.allowed) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: `Sie haben Ihr monatliches Aufgaben-Limit erreicht (${taskLimitCheck.used}/${taskLimitCheck.limit}). Bitte upgraden Sie Ihren Plan.` 
        });
      }

      // Prüfe ob Superprompt vorhanden
      if (!t.superprompt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Diese Aufgabe ist noch nicht vollständig konfiguriert" });
      }

      // === CUSTOM SUPERPROMPT PRIORITÄT ===
      // Priorität: User-spezifisch > Firmen-spezifisch > Global > Basis
      let superpromptToUse = t.superprompt;
      let customTemplateId: number | null = null;
      let customTemplateType: string = "base";

      // 1. User-spezifisches Template suchen
      if (ctx.user.id) {
        const [userTemplate] = await db
          .select()
          .from(customSuperprompts)
          .where(and(
            eq(customSuperprompts.baseTemplateId, t.id),
            eq(customSuperprompts.userId, ctx.user.id),
            eq(customSuperprompts.isActive, 1)
          ))
          .limit(1);

        if (userTemplate) {
          superpromptToUse = userTemplate.superprompt;
          customTemplateId = userTemplate.id;
          customTemplateType = "user";
          // Usage-Count erhöhen
          await db.update(customSuperprompts)
            .set({ 
              usageCount: sql`${customSuperprompts.usageCount} + 1`,
              lastUsedAt: new Date()
            })
            .where(eq(customSuperprompts.id, userTemplate.id));
        }
      }

      // 2. Firmen-spezifisches Template suchen (falls kein User-Template)
      if (!customTemplateId && ctx.user.organizationId) {
        const [orgTemplate] = await db
          .select()
          .from(customSuperprompts)
          .where(and(
            eq(customSuperprompts.baseTemplateId, t.id),
            eq(customSuperprompts.organizationId, ctx.user.organizationId),
            sql`${customSuperprompts.userId} IS NULL`,
            eq(customSuperprompts.isActive, 1)
          ))
          .limit(1);

        if (orgTemplate) {
          superpromptToUse = orgTemplate.superprompt;
          customTemplateId = orgTemplate.id;
          customTemplateType = "organization";
          await db.update(customSuperprompts)
            .set({ 
              usageCount: sql`${customSuperprompts.usageCount} + 1`,
              lastUsedAt: new Date()
            })
            .where(eq(customSuperprompts.id, orgTemplate.id));
        }
      }

      // 3. Globales Custom-Template suchen (falls kein User/Org-Template)
      if (!customTemplateId) {
        const [globalTemplate] = await db
          .select()
          .from(customSuperprompts)
          .where(and(
            eq(customSuperprompts.baseTemplateId, t.id),
            sql`${customSuperprompts.organizationId} IS NULL`,
            sql`${customSuperprompts.userId} IS NULL`,
            eq(customSuperprompts.isActive, 1)
          ))
          .limit(1);

        if (globalTemplate) {
          superpromptToUse = globalTemplate.superprompt;
          customTemplateId = globalTemplate.id;
          customTemplateType = "global";
          await db.update(customSuperprompts)
            .set({ 
              usageCount: sql`${customSuperprompts.usageCount} + 1`,
              lastUsedAt: new Date()
            })
            .where(eq(customSuperprompts.id, globalTemplate.id));
        }
      }

      // 4. Wenn kein Custom-Template existiert und User eingeloggt ist, erstelle automatisch eines
      if (!customTemplateId && ctx.user.id) {
        // Generiere Custom-Template ID: Original-ID + Kunden-ID + Version
        const customerIdPart = `K${ctx.user.id}`;
        const customUniqueId = t.uniqueId 
          ? `${t.uniqueId}-${customerIdPart}-V1`
          : `SP-${new Date().getFullYear()}-${t.id}-${customerIdPart}-V1`;
        
        // Erstelle automatisch ein Custom-Template für den User
        // Hinweis: uniqueId und sourceTemplateUniqueId werden später über DB-Migration hinzugefügt
        const [newCustomTemplate] = await db.insert(customSuperprompts).values({
          baseTemplateId: t.id,
          userId: ctx.user.id,
          organizationId: ctx.user.organizationId || null,
          name: t.name,
          description: t.description || null,
          superprompt: t.superprompt,
          createdBy: ctx.user.id,
          isActive: 1,
          version: 1,
          usageCount: 1,
          lastUsedAt: new Date(),
          // ROI-Werte vom Original übernehmen
          roiBaseTimeMinutes: t.roiBaseTimeMinutes || 30,
          roiTimePerDocumentMinutes: t.roiTimePerDocumentMinutes || 15,
          roiKi2goTimeMinutes: t.roiKi2goTimeMinutes || 3,
          roiHourlyRate: parseInt(String(t.roiHourlyRate)) || 80,
        });
        
        customTemplateId = Number(newCustomTemplate.insertId);
        customTemplateType = "user-auto";
        console.log(`[Workflow] Automatisch Custom-Template erstellt: ${customUniqueId}`);
      }

      console.log(`[Workflow] Template-Typ: ${customTemplateType}, Custom-ID: ${customTemplateId || 'Basis'}`);
      // === ENDE CUSTOM SUPERPROMPT PRIORITÄT ===

      // Validiere Pflichtfelder
      const schema = t.variableSchema || [];
      for (const field of schema) {
        if (field.required && !input.variables[field.key]) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: `Das Feld "${field.label}" ist erforderlich` 
          });
        }
      }

      // Lade Dokument-Inhalte falls vorhanden
      let documentContent = "";
      let documentNames: string[] = [];
      if (input.documentIds && input.documentIds.length > 0) {
        const docs = await db
          .select()
          .from(documents)
          .where(sql`${documents.id} IN (${input.documentIds.join(",")})`);
        
        documentContent = docs.map(d => (d.extractedText as string) || "").join("\n\n---\n\n");
        documentNames = docs.map(d => d.originalFileName || d.fileName || "Dokument");
      }

      // Füge Dokument-Inhalt zu Variablen hinzu (für manuelle {{DOKUMENT}} Variablen)
      const variablesWithDoc = {
        ...input.variables,
        DOKUMENT: documentContent || input.variables.DOKUMENT || "",
        DOCUMENT: documentContent || input.variables.DOCUMENT || "",
        VERTRAGSTEXT: documentContent || input.variables.VERTRAGSTEXT || "",
        VERTRAGSTEXT_VOLLSTAENDIG: documentContent || input.variables.VERTRAGSTEXT_VOLLSTAENDIG || "",
        DOKUMENTINHALT: documentContent || input.variables.DOKUMENTINHALT || "",
      };

      // Ersetze Variablen im Superprompt (verwendet Custom-Template falls vorhanden)
      let finalPrompt = replaceVariables(superpromptToUse, variablesWithDoc);

      // AUTOMATISCH: Wenn Dokumente hochgeladen wurden, füge sie als Kontext-Block hinzu
      // Das funktioniert unabhängig davon, ob der Superprompt eine Dokument-Variable hat
      if (documentContent && documentContent.trim().length > 0) {
        const documentHeader = `
=== HOCHGELADENE DOKUMENTE (${documentNames.length} Datei${documentNames.length > 1 ? 'en' : ''}: ${documentNames.join(', ')}) ===

${documentContent}

=== ENDE DER DOKUMENTE ===

Bitte analysiere die oben stehenden Dokumente im Kontext der folgenden Aufgabe:

`;
        finalPrompt = documentHeader + finalPrompt;
      }

      // Erstelle Execution-Eintrag (pending)
      const executionResult = await db.insert(workflowExecutions).values({
        userId: ctx.user.id,
        organizationId: ctx.user.organizationId,
        templateId: t.id,
        sessionId,
        variableValues: input.variables,
        documentIds: input.documentIds || [],
        superpromptUsed: finalPrompt,
        llmModel: t.llmModel || "default",
        llmTemperature: t.llmTemperature || "0.7",
        status: "processing",
      });

      const executionId = Number(executionResult[0].insertId);

      try {
        // Rufe LLM auf
        const llmResponse = await invokeLLM({
          messages: [
            { role: "user", content: finalPrompt }
          ],
        });

        const content = llmResponse.choices[0]?.message?.content;
        const result = typeof content === 'string' ? content : (Array.isArray(content) ? content.map(c => c.type === 'text' ? c.text : '').join('') : '');
        const executionTimeMs = Date.now() - startTime;

        // Berechne Kosten basierend auf Token-Verbrauch
        // Preise für Gemini 2.5 Flash (approximiert):
        // Input: $0.075 / 1M tokens = €0.00007 / 1K tokens
        // Output: $0.30 / 1M tokens = €0.00028 / 1K tokens
        const inputTokens = llmResponse.usage?.prompt_tokens || 0;
        const outputTokens = llmResponse.usage?.completion_tokens || 0;
        const inputCost = (inputTokens / 1000) * 0.00007; // € pro 1K Input Tokens
        const outputCost = (outputTokens / 1000) * 0.00028; // € pro 1K Output Tokens
        const totalCost = inputCost + outputCost;

        console.log(`[Workflow] Token-Verbrauch: Input=${inputTokens}, Output=${outputTokens}, Kosten=€${totalCost.toFixed(6)}`);

        // === USAGE TRACKING: Erhöhe Verbrauchszähler ===
        await incrementUsage(ctx.user.id, "tasks", 1);
        await incrementTokenUsage(
          ctx.user.id, 
          inputTokens, 
          outputTokens, 
          totalCost,
          ctx.user.organizationId || undefined
        );

        // Update Execution mit Ergebnis und Kosten
        await db
          .update(workflowExecutions)
          .set({
            result,
            status: "completed",
            promptTokens: inputTokens,
            completionTokens: outputTokens,
            totalTokens: llmResponse.usage?.total_tokens || (inputTokens + outputTokens),
            estimatedCost: totalCost.toFixed(6),
            llmModel: llmResponse.model || "gemini-2.5-flash",
            executionTimeMs,
            completedAt: new Date(),
          })
          .where(eq(workflowExecutions.id, executionId));

        // Update Template Usage Count
        await db
          .update(taskTemplates)
          .set({ usageCount: sql`${taskTemplates.usageCount} + 1` })
          .where(eq(taskTemplates.id, t.id));

        return {
          executionId,
          sessionId,
          result,
          executionTimeMs,
          templateTitle: t.title,
          estimatedTimeSavings: t.estimatedTimeSavings,
        };

      } catch (error: any) {
        // Update Execution mit Fehler
        await db
          .update(workflowExecutions)
          .set({
            status: "failed",
            errorMessage: error.message || "Unbekannter Fehler",
            completedAt: new Date(),
          })
          .where(eq(workflowExecutions.id, executionId));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Fehler bei der Ausführung: ${error.message}`,
        });
      }
    }),

  // Feedback abgeben
  submitFeedback: protectedProcedure
    .input(z.object({
      executionId: z.number(),
      rating: z.enum(["positive", "negative"]),
      comment: z.string().optional(), // Allgemeiner Kommentar zum Ergebnis
      feedbackCategory: z.enum([
        "result_quality",
        "missing_information",
        "wrong_format",
        "too_long",
        "too_short",
        "other"
      ]).optional(),
      improvementSuggestion: z.string().optional(),
      suggestedVariables: z.array(z.object({
        name: z.string(),
        description: z.string(),
        type: z.string().optional(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      // Prüfe ob Execution existiert und dem User gehört
      const execution = await db
        .select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.id, input.executionId))
        .limit(1);

      if (!execution.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ausführung nicht gefunden" });
      }

      if (execution[0].userId !== ctx.user.id && ctx.user.role !== "owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung für dieses Feedback" });
      }

      // Prüfe ob bereits Feedback existiert
      const existingFeedback = await db
        .select()
        .from(workflowFeedback)
        .where(and(
          eq(workflowFeedback.executionId, input.executionId),
          eq(workflowFeedback.userId, ctx.user.id)
        ))
        .limit(1);

      if (existingFeedback.length) {
        // Update existierendes Feedback
        await db
          .update(workflowFeedback)
          .set({
            rating: input.rating,
            comment: input.comment,
            feedbackCategory: input.feedbackCategory,
            improvementSuggestion: input.improvementSuggestion,
            suggestedVariables: input.suggestedVariables,
          })
          .where(eq(workflowFeedback.id, existingFeedback[0].id));

        return { success: true, updated: true };
      }

      // Erstelle neues Feedback
      await db.insert(workflowFeedback).values({
        executionId: input.executionId,
        userId: ctx.user.id,
        organizationId: ctx.user.organizationId,
        templateId: execution[0].templateId,
        rating: input.rating,
        comment: input.comment,
        feedbackCategory: input.feedbackCategory,
        improvementSuggestion: input.improvementSuggestion,
        suggestedVariables: input.suggestedVariables,
      });

      // Update Template Rating (vereinfacht)
      const allFeedback = await db
        .select({ rating: workflowFeedback.rating })
        .from(workflowFeedback)
        .where(eq(workflowFeedback.templateId, execution[0].templateId));

      const positiveCount = allFeedback.filter(f => f.rating === "positive").length;
      const totalCount = allFeedback.length;
      const avgRating = totalCount > 0 ? (positiveCount / totalCount) * 5 : null;

      if (avgRating !== null) {
        await db
          .update(taskTemplates)
          .set({ avgRating: String(avgRating.toFixed(2)) })
          .where(eq(taskTemplates.id, execution[0].templateId));
      }

      return { success: true, updated: false };
    }),

  // Meine Ausführungen abrufen
  getMyExecutions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const executions = await db
        .select({
          id: workflowExecutions.id,
          sessionId: workflowExecutions.sessionId,
          templateId: workflowExecutions.templateId,
          templateTitle: taskTemplates.title,
          templateSlug: taskTemplates.slug,
          status: workflowExecutions.status,
          executionTimeMs: workflowExecutions.executionTimeMs,
          startedAt: workflowExecutions.startedAt,
          completedAt: workflowExecutions.completedAt,
        })
        .from(workflowExecutions)
        .leftJoin(taskTemplates, eq(workflowExecutions.templateId, taskTemplates.id))
        .where(eq(workflowExecutions.userId, ctx.user.id))
        .orderBy(desc(workflowExecutions.startedAt))
        .limit(input.limit)
        .offset(input.offset);

      return executions;
    }),

  // Einzelne Ausführung abrufen (mit Ergebnis)
  getExecution: protectedProcedure
    .input(z.object({ executionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

      const execution = await db
        .select({
          id: workflowExecutions.id,
          sessionId: workflowExecutions.sessionId,
          templateId: workflowExecutions.templateId,
          variableValues: workflowExecutions.variableValues,
          result: workflowExecutions.result,
          resultFormat: workflowExecutions.resultFormat,
          status: workflowExecutions.status,
          errorMessage: workflowExecutions.errorMessage,
          executionTimeMs: workflowExecutions.executionTimeMs,
          startedAt: workflowExecutions.startedAt,
          completedAt: workflowExecutions.completedAt,
          createdAt: workflowExecutions.startedAt,
        })
        .from(workflowExecutions)
        .where(eq(workflowExecutions.id, input.executionId))
        .limit(1);

      if (!execution.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ausführung nicht gefunden" });
      }

      // Prüfe Berechtigung
      const exec = execution[0];
      if (ctx.user.role !== "owner") {
        // Hole userId aus separater Query
        const execUser = await db
          .select({ userId: workflowExecutions.userId })
          .from(workflowExecutions)
          .where(eq(workflowExecutions.id, input.executionId))
          .limit(1);
        
        if (execUser[0]?.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Keine Berechtigung für diese Ausführung" });
        }
      }

      // Lade Feedback falls vorhanden
      const feedback = await db
        .select()
        .from(workflowFeedback)
        .where(and(
          eq(workflowFeedback.executionId, input.executionId),
          eq(workflowFeedback.userId, ctx.user.id)
        ))
        .limit(1);

      // Lade Template-Daten inkl. ROI-Felder und Disclaimer
      const template = await db
        .select({
          id: taskTemplates.id,
          title: taskTemplates.title,
          slug: taskTemplates.slug,
          icon: taskTemplates.icon,
          color: taskTemplates.color,
          estimatedTimeSavings: taskTemplates.estimatedTimeSavings,
          roiBaseTimeMinutes: taskTemplates.roiBaseTimeMinutes,
          roiTimePerDocumentMinutes: taskTemplates.roiTimePerDocumentMinutes,
          roiKi2goTimeMinutes: taskTemplates.roiKi2goTimeMinutes,
          roiHourlyRate: taskTemplates.roiHourlyRate,
          disclaimer: taskTemplates.disclaimer,
        })
        .from(taskTemplates)
        .where(eq(taskTemplates.id, exec.templateId))
        .limit(1);

      // Lade zugehörige Dokumente für diese Ausführung
      // Zuerst: Lade documentIds direkt aus der Execution
      const execWithDocs = await db
        .select({ documentIds: workflowExecutions.documentIds })
        .from(workflowExecutions)
        .where(eq(workflowExecutions.id, input.executionId))
        .limit(1);
      
      let documentIds: number[] = [];
      
      // 1. Versuche documentIds direkt aus der Execution zu laden
      if (execWithDocs[0]?.documentIds) {
        const rawDocIds = execWithDocs[0].documentIds;
        if (Array.isArray(rawDocIds)) {
          documentIds = rawDocIds.filter((id): id is number => typeof id === 'number');
        } else if (typeof rawDocIds === 'string') {
          try {
            const parsed = JSON.parse(rawDocIds);
            if (Array.isArray(parsed)) {
              documentIds = parsed.filter((id): id is number => typeof id === 'number');
            }
          } catch (e) {
            // Ignoriere Parse-Fehler
          }
        }
      }
      
      // 2. Falls keine documentIds gefunden, versuche aus variableValues zu extrahieren (Fallback)
      if (documentIds.length === 0) {
        let variableValues: Record<string, any> = {};
        try {
          if (exec.variableValues) {
            if (typeof exec.variableValues === 'string') {
              variableValues = JSON.parse(exec.variableValues);
            } else if (typeof exec.variableValues === 'object') {
              variableValues = exec.variableValues as Record<string, any>;
            }
          }
        } catch (e) {
          // Falls JSON-Parsing fehlschlägt, leeres Objekt verwenden
          variableValues = {};
        }
        
        // Sammle alle documentIds aus den Variablen
        for (const value of Object.values(variableValues)) {
          if (typeof value === 'object' && value !== null && 'documentId' in value) {
            documentIds.push((value as any).documentId);
          }
        }
      }
      
      let executionDocs: any[] = [];
      if (documentIds.length > 0) {
        executionDocs = await db
          .select({
            id: documents.id,
            fileName: documents.fileName,
            fileType: documents.mimeType,
            fileSize: documents.fileSize,
            fileUrl: documents.fileUrl,
            extractedText: documents.extractedText,
            documentType: documents.category,
            createdAt: documents.uploadedAt,
          })
          .from(documents)
          .where(sql`${documents.id} IN (${sql.join(documentIds.map(id => sql`${id}`), sql`, `)})`)
          .orderBy(documents.uploadedAt);
      }

      return {
        ...exec,
        template: template.length ? template[0] : null,
        feedback: feedback.length ? feedback[0] : null,
        documents: executionDocs,
      };
    }),

  // Verfügbare Aufgaben für den User (basierend auf Organisation)
  getAvailableTasks: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });

    // Owner sieht alle aktiven Templates
    if (ctx.user.role === "owner") {
      const templates = await db
        .select({
          id: taskTemplates.id,
          slug: taskTemplates.slug,
          title: taskTemplates.title,
          shortDescription: taskTemplates.shortDescription,
          categoryId: taskTemplates.categoryId,
          businessAreaId: taskTemplates.businessAreaId,
          icon: taskTemplates.icon,
          color: taskTemplates.color,
          estimatedTimeSavings: taskTemplates.estimatedTimeSavings,
          documentRequired: taskTemplates.documentRequired,
          usageCount: taskTemplates.usageCount,
          avgRating: taskTemplates.avgRating,
        })
        .from(taskTemplates)
        .where(eq(taskTemplates.status, "active"))
        .orderBy(taskTemplates.displayOrder);

      return templates;
    }

    // Normale User sehen nur Templates ihrer Organisation
    if (!ctx.user.organizationId) {
      return [];
    }

    const templates = await db
      .select({
        id: taskTemplates.id,
        slug: taskTemplates.slug,
        title: taskTemplates.title,
        shortDescription: taskTemplates.shortDescription,
        categoryId: taskTemplates.categoryId,
        businessAreaId: taskTemplates.businessAreaId,
        icon: taskTemplates.icon,
        color: taskTemplates.color,
        estimatedTimeSavings: taskTemplates.estimatedTimeSavings,
        documentRequired: taskTemplates.documentRequired,
        usageCount: taskTemplates.usageCount,
        avgRating: taskTemplates.avgRating,
      })
      .from(organizationTemplates)
      .innerJoin(taskTemplates, eq(organizationTemplates.templateId, taskTemplates.id))
      .where(and(
        eq(organizationTemplates.organizationId, ctx.user.organizationId),
        eq(organizationTemplates.isActive, 1),
        eq(taskTemplates.status, "active")
      ))
      .orderBy(taskTemplates.displayOrder);

    return templates;
  }),
});
