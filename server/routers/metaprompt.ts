import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { metapromptTemplates, adminLogs, taskTemplates, categories, businessAreas, organizationTemplates } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

// Helper: Slug aus Name generieren
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Helper: Admin-Berechtigung prüfen
function requireAdmin(role: string) {
  if (role !== 'admin' && role !== 'owner') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Nur Administratoren können diese Aktion ausführen'
    });
  }
}

// Helper: Admin-Log erstellen
async function logAdminAction(
  db: any,
  userId: number,
  action: string,
  targetType: string,
  targetId: number,
  changes: any
) {
  await db.insert(adminLogs).values({
    userId,
    action,
    targetType,
    targetId,
    changes: JSON.stringify(changes),
  });
}

// Variablen aus Text extrahieren
function extractVariables(text: string): string[] {
  const regex = /\{\{([A-Z_][A-Z0-9_]*)\}\}/g;
  const variables: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
}

// Variablen-Typ basierend auf Namen erraten
function guessVariableType(name: string): 'text' | 'textarea' | 'number' | 'select' | 'file' {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('dokument') || lowerName.includes('datei') || lowerName.includes('file') || lowerName.includes('upload')) {
    return 'file';
  }
  if (lowerName.includes('beschreibung') || lowerName.includes('kontext') || lowerName.includes('details') || lowerName.includes('text') || lowerName.includes('inhalt')) {
    return 'textarea';
  }
  if (lowerName.includes('anzahl') || lowerName.includes('number') || lowerName.includes('menge') || lowerName.includes('budget') || lowerName.includes('preis')) {
    return 'number';
  }
  if (lowerName.includes('typ') || lowerName.includes('art') || lowerName.includes('kategorie') || lowerName.includes('auswahl') || lowerName.includes('rechtsraum') || lowerName.includes('sprache')) {
    return 'select';
  }
  return 'text';
}

// Label aus Variable-Namen generieren
function generateLabel(name: string): string {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Platzhalter basierend auf Variable und Aufgabe generieren
function generatePlaceholder(name: string, taskDescription: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('dokument') || lowerName.includes('datei')) {
    return 'Datei hier hochladen';
  }
  if (lowerName.includes('vertragstyp')) {
    return 'z.B. Mietvertrag, Kaufvertrag';
  }
  if (lowerName.includes('rechtsraum')) {
    return 'z.B. Deutschland, Österreich, Schweiz';
  }
  if (lowerName.includes('sprache')) {
    return 'z.B. Deutsch, Englisch';
  }
  if (lowerName.includes('kontext') || lowerName.includes('beschreibung')) {
    return 'Geben Sie hier zusätzliche Informationen ein...';
  }
  if (lowerName.includes('priorit')) {
    return 'z.B. Kosten, Fristen, Haftung';
  }
  return `${generateLabel(name)} eingeben...`;
}

// Hilfetext basierend auf Variable und Aufgabe generieren
function generateHelpText(name: string, taskDescription: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('dokument') || lowerName.includes('datei')) {
    return 'Laden Sie das zu analysierende Dokument hoch (PDF, DOCX)';
  }
  if (lowerName.includes('vertragstyp')) {
    return 'Wählen Sie die Art des Vertrags für eine präzisere Analyse';
  }
  if (lowerName.includes('rechtsraum')) {
    return 'Der Rechtsraum beeinflusst die anzuwendenden Gesetze';
  }
  if (lowerName.includes('sprache')) {
    return 'In welcher Sprache soll das Ergebnis erstellt werden?';
  }
  if (lowerName.includes('kontext')) {
    return 'Zusätzliche Informationen helfen bei einer besseren Analyse';
  }
  if (lowerName.includes('priorit')) {
    return 'Welche Aspekte sollen besonders berücksichtigt werden?';
  }
  return `Geben Sie ${generateLabel(name)} für die Aufgabe an`;
}

// Standard-Optionen für Select-Felder generieren
function generateDefaultOptions(name: string): string[] {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('vertragstyp')) {
    return ['Mietvertrag', 'Kaufvertrag', 'Arbeitsvertrag', 'Dienstleistungsvertrag', 'Lizenzvertrag', 'Sonstiger Vertrag'];
  }
  if (lowerName.includes('rechtsraum')) {
    return ['Deutschland', 'Österreich', 'Schweiz', 'EU-weit', 'International'];
  }
  if (lowerName.includes('sprache')) {
    return ['Deutsch', 'Englisch', 'Französisch', 'Spanisch', 'Italienisch'];
  }
  if (lowerName.includes('format')) {
    return ['Bericht', 'Zusammenfassung', 'Checkliste', 'Präsentation'];
  }
  if (lowerName.includes('dringlichkeit') || lowerName.includes('prioritaet')) {
    return ['Hoch', 'Mittel', 'Niedrig'];
  }
  return [];
}

// Import & Formatierung: Rohtext in korrektes Format konvertieren
async function formatAndValidatePrompt(
  rawText: string,
  promptType: 'metaprompt' | 'superprompt'
): Promise<{
  formattedText: string;
  variables: string[];
  issues: string[];
  suggestions: string[];
}> {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let formattedText = rawText.trim();
  
  // 1. Verschiedene Variablen-Formate erkennen und normalisieren
  // {variable}, [variable], <variable>, {{variable}}, $variable, %variable%
  const variablePatterns = [
    /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,           // {variable}
    /\[([a-zA-Z_][a-zA-Z0-9_]*)\]/g,           // [variable]
    /<([a-zA-Z_][a-zA-Z0-9_]*)>/g,             // <variable>
    /\$([a-zA-Z_][a-zA-Z0-9_]*)/g,             // $variable
    /%([a-zA-Z_][a-zA-Z0-9_]*)%/g,             // %variable%
    /\[\[([a-zA-Z_][a-zA-Z0-9_]*)\]\]/g,       // [[variable]]
  ];
  
  // Alle gefundenen Variablen sammeln
  const foundVariables = new Set<string>();
  
  // Bereits korrekte {{VARIABLE}} Format finden
  const correctPattern = /\{\{([A-Z_][A-Z0-9_]*)\}\}/g;
  let match;
  while ((match = correctPattern.exec(formattedText)) !== null) {
    foundVariables.add(match[1]);
  }
  
  // Andere Formate finden und konvertieren
  for (const pattern of variablePatterns) {
    formattedText = formattedText.replace(pattern, (_, varName) => {
      const normalizedName = varName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      foundVariables.add(normalizedName);
      if (varName !== normalizedName) {
        issues.push(`Variable "${varName}" wurde zu "${normalizedName}" normalisiert`);
      }
      return `{{${normalizedName}}}`;
    });
  }
  
  // 2. Doppelte geschweifte Klammern mit Kleinbuchstaben korrigieren
  formattedText = formattedText.replace(/\{\{([a-z_][a-z0-9_]*)\}\}/gi, (_, varName) => {
    const normalizedName = varName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    foundVariables.add(normalizedName);
    return `{{${normalizedName}}}`;
  });
  
  // 3. Validierung
  if (foundVariables.size === 0) {
    issues.push('Keine Variablen gefunden. Fügen Sie Platzhalter wie {{VARIABLE_NAME}} hinzu.');
  }
  
  // 4. Struktur-Vorschläge basierend auf Prompt-Typ
  if (promptType === 'metaprompt') {
    if (!formattedText.includes('{{AUFGABE}}') && !formattedText.includes('{{TASK}}')) {
      suggestions.push('Metaprompts sollten {{AUFGABE}} oder {{TASK}} für die Aufgabenbeschreibung enthalten');
    }
    if (!formattedText.includes('{{KATEGORIE}}') && !formattedText.includes('{{CATEGORY}}')) {
      suggestions.push('Empfehlung: {{KATEGORIE}} für die Aufgabenkategorie hinzufügen');
    }
  }
  
  if (promptType === 'superprompt') {
    // Prüfen ob wichtige Abschnitte vorhanden sind
    const hasRole = /rolle|role|experte|expert/i.test(formattedText);
    const hasTask = /aufgabe|task|ziel|goal/i.test(formattedText);
    const hasOutput = /ausgabe|output|format|ergebnis|result/i.test(formattedText);
    
    if (!hasRole) suggestions.push('Empfehlung: Definieren Sie eine Rolle für die KI (z.B. "Du bist ein Experte für...")');
    if (!hasTask) suggestions.push('Empfehlung: Beschreiben Sie die Aufgabe klar und deutlich');
    if (!hasOutput) suggestions.push('Empfehlung: Definieren Sie das gewünschte Ausgabeformat');
  }
  
  return {
    formattedText,
    variables: Array.from(foundVariables),
    issues,
    suggestions,
  };
}

export const metapromptRouter = router({
  // Alle Metaprompts auflisten
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Datenbank nicht verfügbar' });
    
    const results = await db
      .select()
      .from(metapromptTemplates)
      .where(eq(metapromptTemplates.isActive, 1))
      .orderBy(desc(metapromptTemplates.isDefault), desc(metapromptTemplates.createdAt));
    
    return results;
  }),

  // Einzelnes Metaprompt laden
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Datenbank nicht verfügbar' });
      
      const results = await db
        .select()
        .from(metapromptTemplates)
        .where(eq(metapromptTemplates.id, input.id))
        .limit(1);
      
      if (results.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Metaprompt nicht gefunden' });
      }
      
      return results[0];
    }),

  // Standard-Metaprompt laden
  getDefault: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Datenbank nicht verfügbar' });
    
    const results = await db
      .select()
      .from(metapromptTemplates)
      .where(and(
        eq(metapromptTemplates.isDefault, 1),
        eq(metapromptTemplates.isActive, 1)
      ))
      .limit(1);
    
    if (results.length === 0) {
      // Fallback: Erstes aktives Template
      const fallback = await db
        .select()
        .from(metapromptTemplates)
        .where(eq(metapromptTemplates.isActive, 1))
        .orderBy(desc(metapromptTemplates.createdAt))
        .limit(1);
      
      return fallback[0] || null;
    }
    
    return results[0];
  }),

  // Neues Metaprompt erstellen
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      template: z.string().min(1),
      targetAudience: z.string().optional(),
      outputStyle: z.string().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Datenbank nicht verfügbar' });
      
      // Wenn als Standard markiert, alle anderen zurücksetzen
      if (input.isDefault) {
        await db
          .update(metapromptTemplates)
          .set({ isDefault: 0 })
          .where(eq(metapromptTemplates.isDefault, 1));
      }
      
      const result = await db.insert(metapromptTemplates).values({
        name: input.name,
        description: input.description || null,
        template: input.template,
        targetAudience: input.targetAudience || null,
        outputStyle: input.outputStyle || null,
        isDefault: input.isDefault ? 1 : 0,
        isActive: 1,
        version: 1,
        createdBy: ctx.user.id,
      });
      
      const insertId = Number(result[0].insertId);
      
      await logAdminAction(db, ctx.user.id, 'create', 'metaprompt', insertId, {
        name: input.name,
        isDefault: input.isDefault,
      });
      
      return { id: insertId, success: true };
    }),

  // Metaprompt aktualisieren
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      template: z.string().min(1).optional(),
      targetAudience: z.string().optional(),
      outputStyle: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Datenbank nicht verfügbar' });
      
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.template !== undefined) {
        updateData.template = input.template;
        // Version erhöhen bei Template-Änderung
        updateData.version = sql`${metapromptTemplates.version} + 1`;
      }
      if (input.targetAudience !== undefined) updateData.targetAudience = input.targetAudience;
      if (input.outputStyle !== undefined) updateData.outputStyle = input.outputStyle;
      
      await db
        .update(metapromptTemplates)
        .set(updateData)
        .where(eq(metapromptTemplates.id, input.id));
      
      await logAdminAction(db, ctx.user.id, 'update', 'metaprompt', input.id, updateData);
      
      return { success: true };
    }),

  // Metaprompt als Standard setzen
  setDefault: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Datenbank nicht verfügbar' });
      
      // Alle anderen zurücksetzen
      await db
        .update(metapromptTemplates)
        .set({ isDefault: 0 })
        .where(eq(metapromptTemplates.isDefault, 1));
      
      // Dieses als Standard setzen
      await db
        .update(metapromptTemplates)
        .set({ isDefault: 1 })
        .where(eq(metapromptTemplates.id, input.id));
      
      await logAdminAction(db, ctx.user.id, 'setDefault', 'metaprompt', input.id, { isDefault: true });
      
      return { success: true };
    }),

  // Metaprompt löschen (soft delete)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Datenbank nicht verfügbar' });
      
      await db
        .update(metapromptTemplates)
        .set({ isActive: 0, isDefault: 0 })
        .where(eq(metapromptTemplates.id, input.id));
      
      await logAdminAction(db, ctx.user.id, 'delete', 'metaprompt', input.id, { deleted: true });
      
      return { success: true };
    }),

  // Variablen aus Text extrahieren
  extractVariables: protectedProcedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input }) => {
      const variables = extractVariables(input.text);
      
      const schema = variables.map(name => ({
        key: name,
        label: generateLabel(name),
        type: guessVariableType(name),
        required: true,
        placeholder: '',
        helpText: '',
      }));
      
      return { variables, schema };
    }),

  // KI-gestützter Superprompt-Generator
  generateSuperprompt: protectedProcedure
    .input(z.object({
      metapromptId: z.number().optional(),
      customMetaprompt: z.string().optional(), // Extern erstelltes Metaprompt direkt einfügen
      taskDescription: z.string().min(10),
      categoryId: z.number().optional(),
      businessAreaId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Datenbank nicht verfügbar' });
      
      // Metaprompt laden (oder Standard verwenden oder custom)
      let metaprompt: any = null;
      let metapromptSource = 'Standard';
      
      if (input.customMetaprompt && input.customMetaprompt.trim()) {
        // Custom Metaprompt aus LLM verwenden - zuerst formatieren
        const formatResult = await formatAndValidatePrompt(input.customMetaprompt, 'metaprompt');
        metaprompt = {
          name: 'Custom Metaprompt (importiert)',
          template: formatResult.formattedText,
        };
        metapromptSource = 'Custom (aus LLM importiert)';
      } else if (input.metapromptId) {
        const results = await db
          .select()
          .from(metapromptTemplates)
          .where(eq(metapromptTemplates.id, input.metapromptId))
          .limit(1);
        metaprompt = results[0];
        if (metaprompt) metapromptSource = metaprompt.name;
      } else {
        // Standard-Metaprompt laden
        const results = await db
          .select()
          .from(metapromptTemplates)
          .where(and(
            eq(metapromptTemplates.isDefault, 1),
            eq(metapromptTemplates.isActive, 1)
          ))
          .limit(1);
        metaprompt = results[0];
        if (metaprompt) metapromptSource = `${metaprompt.name} (Standard)`;
      }
      
      // Kategorie und Bereich laden (falls angegeben)
      let categoryName = '';
      let businessAreaName = '';
      
      if (input.categoryId) {
        const cat = await db.select().from(categories).where(eq(categories.id, input.categoryId)).limit(1);
        if (cat[0]) categoryName = cat[0].name;
      }
      
      if (input.businessAreaId) {
        const area = await db.select().from(businessAreas).where(eq(businessAreas.id, input.businessAreaId)).limit(1);
        if (area[0]) businessAreaName = area[0].name;
      }
      
      // System-Prompt für den Generator
      const systemPrompt = `Du bist ein Experte für die Erstellung von KI-Prompts (Superprompts) für Unternehmensanwendungen.

Deine Aufgabe ist es, basierend auf einer Aufgabenbeschreibung einen professionellen, strukturierten Superprompt zu erstellen.

REGELN:
1. Verwende {{VARIABLE_NAME}} für Platzhalter (Großbuchstaben mit Unterstrichen)
2. Erstelle mindestens 3-5 relevante Variablen
3. Der Prompt sollte klar strukturiert sein mit Abschnitten
4. Füge Kontext, Anforderungen und Ausgabeformat hinzu
5. Variablen sollten sinnvolle Namen haben wie:
   - {{KONTEXT}} für zusätzliche Informationen
   - {{VERTRAGSTYP}}, {{RECHTSRAUM}} für Auswahl-Felder
   - {{PRIORITAETEN}} für Textbereiche
6. WICHTIG: Erstelle KEINE {{DOKUMENT}} Variable für Datei-Uploads!
   Dokumente werden über einen separaten Upload-Schritt bereitgestellt.
   Referenziere das Dokument im Prompt einfach als "das hochgeladene Dokument" oder "die bereitgestellte Datei".

${metaprompt ? `VERWENDE DIESES METAPROMPT-TEMPLATE ALS BASIS:
${metaprompt.template}

Passe das Template an die spezifische Aufgabe an.` : ''}

${categoryName ? `KATEGORIE: ${categoryName}` : ''}
${businessAreaName ? `UNTERNEHMENSBEREICH: ${businessAreaName}` : ''}

Antworte NUR mit dem generierten Superprompt, ohne zusätzliche Erklärungen.`;

      // LLM aufrufen
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Erstelle einen Superprompt für folgende Aufgabe:\n\n${input.taskDescription}` }
        ],
      });
      
      const messageContent = response.choices[0]?.message?.content;
      const generatedSuperprompt = typeof messageContent === 'string' ? messageContent : '';
      
      // Variablen aus generiertem Prompt extrahieren
      const variables = extractVariables(generatedSuperprompt);
      
      // Intelligente Variablen-Vorschläge mit LLM generieren
      const variablePrompt = `Analysiere diese Variablen aus einem Superprompt und erstelle für jede Variable intelligente Vorschläge.

AUFGABE: ${input.taskDescription}

VARIABLEN: ${variables.join(', ')}

Erstelle für JEDE Variable ein JSON-Objekt mit:
- key: Der Variablenname (exakt wie oben)
- label: Ein benutzerfreundlicher deutscher Name
- type: "text" | "textarea" | "select" | "multiselect" | "file" | "number" | "date"
- required: true/false
- placeholder: Ein Beispiel-Platzhalter passend zur Aufgabe
- helpText: Eine kurze Erklärung was eingegeben werden soll
- options: Bei select/multiselect: Array mit 3-6 sinnvollen Optionen, sonst null

BEISPIEL für VERTRAGSTYP bei Vertragsanalyse:
{
  "key": "VERTRAGSTYP",
  "label": "Vertragstyp",
  "type": "select",
  "required": true,
  "placeholder": "Wählen Sie den Vertragstyp",
  "helpText": "Wählen Sie die Art des zu analysierenden Vertrags",
  "options": ["Mietvertrag", "Kaufvertrag", "Arbeitsvertrag", "Dienstleistungsvertrag", "Lizenzvertrag"]
}

Antworte NUR mit einem JSON-Array der Variablen-Objekte, ohne zusätzlichen Text.`;

      let variableSchema;
      try {
        const variableResponse = await invokeLLM({
          messages: [
            { role: 'system', content: 'Du bist ein Experte für die Erstellung von Formular-Feldern. Antworte ausschließlich mit validem JSON.' },
            { role: 'user', content: variablePrompt }
          ],
        });
        
        const variableContent = variableResponse.choices[0]?.message?.content;
        const jsonStr = typeof variableContent === 'string' ? variableContent : '';
        // JSON aus der Antwort extrahieren (falls mit Markdown umgeben)
        const jsonMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          variableSchema = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Kein valides JSON gefunden');
        }
      } catch (error) {
        // Fallback: Einfache Variablen-Generierung
        console.error('[Generator] Variable generation failed, using fallback:', error);
        variableSchema = variables.map(name => ({
          key: name,
          label: generateLabel(name),
          type: guessVariableType(name),
          required: !name.toLowerCase().includes('optional'),
          placeholder: generatePlaceholder(name, input.taskDescription),
          helpText: generateHelpText(name, input.taskDescription),
          options: guessVariableType(name) === 'select' ? generateDefaultOptions(name) : undefined,
        }));
      }
      
      // Titel und Slug generieren
      const titleMatch = typeof generatedSuperprompt === 'string' ? generatedSuperprompt.match(/^#\s*(.+)$/m) : null;
      const suggestedTitle = titleMatch ? titleMatch[1].trim() : input.taskDescription.slice(0, 50);
      const suggestedSlug = generateSlug(suggestedTitle);
      
      return {
        superprompt: generatedSuperprompt,
        variables,
        variableSchema,
        suggestedTitle,
        suggestedSlug,
        metapromptUsed: metapromptSource,
      };
    }),

  // Generierten Superprompt als Template speichern
  saveAsTemplate: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      superprompt: z.string().min(1),
      variableSchema: z.array(z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(['text', 'textarea', 'number', 'select', 'file', 'multiselect', 'date']),
        required: z.boolean(),
        placeholder: z.string().optional(),
        helpText: z.string().optional(),
        options: z.array(z.string()).optional(),
      })),
      categoryId: z.number().optional(),
      businessAreaId: z.number().optional(),
      estimatedTimeSavings: z.number().optional(),
      metapromptId: z.number().optional(), // Welches Metaprompt wurde verwendet
      // ROI-Kalkulation
      roiBaseTimeMinutes: z.number().optional(),
      roiTimePerDocumentMinutes: z.number().optional(),
      roiKi2goTimeMinutes: z.number().optional(),
      roiHourlyRate: z.number().optional(),
      // Öffentlich-Einstellung
      isPublic: z.number().optional().default(0),
      // Dokument-Einstellungen
      documentRequired: z.number().optional().default(1), // Standard: Dokument erforderlich
      documentCount: z.number().optional().default(1),
      // Organisations-Zuweisung
      assignToOrganizationId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Datenbank nicht verfügbar' });
      
      // Prüfen ob Slug bereits existiert
      const existing = await db
        .select()
        .from(taskTemplates)
        .where(eq(taskTemplates.slug, input.slug))
        .limit(1);
      
      if (existing.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ein Template mit diesem Slug existiert bereits'
        });
      }
      
      // Eindeutige ID generieren: SP-YYYY-NNN
      const year = new Date().getFullYear();
      const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(taskTemplates);
      const count = (countResult[0]?.count || 0) + 1;
      const uniqueId = `SP-${year}-${String(count).padStart(3, '0')}`;
      
      // DOKUMENT-Variable aus Schema entfernen (wird über separaten Upload geliefert)
      const cleanedVariableSchema = input.variableSchema.filter(v => v.key !== 'DOKUMENT');
      
      const result = await db.insert(taskTemplates).values({
        slug: input.slug,
        name: input.slug,
        title: input.title,
        description: input.description || null,
        shortDescription: input.description?.slice(0, 200) || null,
        categoryId: input.categoryId || null,
        businessAreaId: input.businessAreaId || null,
        variableSchema: cleanedVariableSchema,
        superprompt: input.superprompt,
        estimatedTimeSavings: input.estimatedTimeSavings || null,
        status: 'draft',
        // Neue Audit-Felder
        uniqueId,
        creationMethod: 'generator',
        sourceMetapromptId: input.metapromptId || null,
        createdBy: ctx.user.id,
        updatedBy: ctx.user.id,
        // ROI-Kalkulation
        roiBaseTimeMinutes: input.roiBaseTimeMinutes ?? 30,
        roiTimePerDocumentMinutes: input.roiTimePerDocumentMinutes ?? 15,
        roiKi2goTimeMinutes: input.roiKi2goTimeMinutes ?? 3,
        roiHourlyRate: input.roiHourlyRate ?? 80,
        // Öffentlich-Einstellung
        isPublic: input.isPublic ?? 0,
        // Dokument-Einstellungen (Standard: Dokument erforderlich)
        documentRequired: input.documentRequired ?? 1,
        documentCount: input.documentCount ?? 1,
      });
      
      const insertId = Number(result[0].insertId);
      
      await logAdminAction(db, ctx.user.id, 'create', 'taskTemplate', insertId, {
        title: input.title,
        slug: input.slug,
        uniqueId,
        source: 'generator',
        metapromptId: input.metapromptId,
      });
      
      // Wenn eine Organisation ausgewählt wurde, Template automatisch freigeben
      if (input.assignToOrganizationId) {
        await db.insert(organizationTemplates).values({
          organizationId: input.assignToOrganizationId,
          templateId: insertId,
          isActive: 1,
          assignedBy: ctx.user.id,
        });
        
        await logAdminAction(db, ctx.user.id, 'assign', 'organizationTemplate', insertId, {
          organizationId: input.assignToOrganizationId,
          templateId: insertId,
        });
      }
      
      return { id: insertId, uniqueId, success: true };
    }),

  // Import & Formatierung: Rohtext validieren und formatieren
  importAndFormat: protectedProcedure
    .input(z.object({
      rawText: z.string().min(10),
      promptType: z.enum(['metaprompt', 'superprompt']),
      taskDescription: z.string().optional(), // Für Superprompts: Kontext für Variablen-Generierung
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      
      // 1. Formatierung und Validierung
      const formatResult = await formatAndValidatePrompt(input.rawText, input.promptType);
      
      // 2. Variablen extrahieren
      const variables = extractVariables(formatResult.formattedText);
      
      // 3. Intelligente Variablen-Schema-Generierung mit LLM
      let variableSchema;
      const taskContext = input.taskDescription || 'Allgemeine Aufgabe';
      
      if (variables.length > 0) {
        const variablePrompt = `Analysiere diese Variablen aus einem ${input.promptType === 'metaprompt' ? 'Metaprompt' : 'Superprompt'} und erstelle für jede Variable intelligente Vorschläge.

KONTEXT: ${taskContext}

VARIABLEN: ${variables.join(', ')}

Erstelle für JEDE Variable ein JSON-Objekt mit:
- key: Der Variablenname (exakt wie oben)
- label: Ein benutzerfreundlicher deutscher Name
- type: "text" | "textarea" | "select" | "multiselect" | "file" | "number" | "date"
- required: true/false
- placeholder: Ein Beispiel-Platzhalter
- helpText: Eine kurze Erklärung was eingegeben werden soll
- options: Bei select/multiselect: Array mit 3-6 sinnvollen Optionen, sonst null

Antworte NUR mit einem JSON-Array der Variablen-Objekte, ohne zusätzlichen Text.`;

        try {
          const variableResponse = await invokeLLM({
            messages: [
              { role: 'system', content: 'Du bist ein Experte für die Erstellung von Formular-Feldern. Antworte ausschließlich mit validem JSON.' },
              { role: 'user', content: variablePrompt }
            ],
          });
          
          const variableContent = variableResponse.choices[0]?.message?.content;
          const jsonStr = typeof variableContent === 'string' ? variableContent : '';
          const jsonMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            variableSchema = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Kein valides JSON gefunden');
          }
        } catch (error) {
          console.error('[Import] Variable generation failed, using fallback:', error);
          variableSchema = variables.map(name => ({
            key: name,
            label: generateLabel(name),
            type: guessVariableType(name),
            required: !name.toLowerCase().includes('optional'),
            placeholder: generatePlaceholder(name, taskContext),
            helpText: generateHelpText(name, taskContext),
            options: guessVariableType(name) === 'select' ? generateDefaultOptions(name) : undefined,
          }));
        }
      } else {
        variableSchema = [];
      }
      
      // 4. Titel-Vorschlag generieren
      let suggestedTitle = '';
      let suggestedSlug = '';
      
      if (input.promptType === 'superprompt') {
        // Versuche Titel aus dem Text zu extrahieren
        const titleMatch = formatResult.formattedText.match(/^#\s*(.+)$/m);
        if (titleMatch) {
          suggestedTitle = titleMatch[1].trim();
        } else {
          // Erste Zeile oder Aufgabenbeschreibung als Titel
          const firstLine = formatResult.formattedText.split('\n')[0].slice(0, 60);
          suggestedTitle = input.taskDescription?.slice(0, 60) || firstLine;
        }
        suggestedSlug = generateSlug(suggestedTitle);
      }
      
      return {
        formattedText: formatResult.formattedText,
        variables,
        variableSchema,
        issues: formatResult.issues,
        suggestions: formatResult.suggestions,
        suggestedTitle,
        suggestedSlug,
        isValid: formatResult.issues.filter(i => !i.includes('normalisiert')).length === 0,
      };
    }),

  // KI-gestützte Verbesserung eines importierten Prompts
  improvePrompt: protectedProcedure
    .input(z.object({
      rawText: z.string().min(10),
      promptType: z.enum(['metaprompt', 'superprompt']),
      taskDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.user.role);
      
      const systemPrompt = input.promptType === 'metaprompt'
        ? `Du bist ein Experte für die Erstellung von Metaprompts für KI-Anwendungen.
Ein Metaprompt ist ein Template, das verwendet wird, um Superprompts zu generieren.

Verbessere den folgenden Metaprompt:
1. Stelle sicher, dass {{AUFGABE}} für die Aufgabenbeschreibung verwendet wird
2. Füge {{KATEGORIE}} und {{UNTERNEHMENSBEREICH}} hinzu falls sinnvoll
3. Strukturiere den Prompt klar mit Abschnitten
4. Verwende {{VARIABLE_NAME}} Format für alle Platzhalter (Großbuchstaben mit Unterstrichen)
5. Füge Anweisungen für Ausgabeformat hinzu

Gib NUR den verbesserten Metaprompt zurück, ohne Erklärungen.`
        : `Du bist ein Experte für die Erstellung von Superprompts für KI-Anwendungen.

Verbessere den folgenden Superprompt:
1. Definiere eine klare Rolle für die KI
2. Strukturiere die Aufgabe in klare Schritte
3. Verwende {{VARIABLE_NAME}} Format für alle Platzhalter (Großbuchstaben mit Unterstrichen)
4. Füge ein klares Ausgabeformat hinzu
5. Ergänze fehlende aber wichtige Variablen

${input.taskDescription ? `KONTEXT: ${input.taskDescription}\n` : ''}
Gib NUR den verbesserten Superprompt zurück, ohne Erklärungen.`;

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input.rawText }
        ],
      });
      
      const improvedText = response.choices[0]?.message?.content;
      if (typeof improvedText !== 'string' || !improvedText.trim()) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Verbesserung fehlgeschlagen' });
      }
      
      // Formatierung und Validierung des verbesserten Textes
      const formatResult = await formatAndValidatePrompt(improvedText, input.promptType);
      const variables = extractVariables(formatResult.formattedText);
      
      return {
        improvedText: formatResult.formattedText,
        variables,
        issues: formatResult.issues,
        suggestions: formatResult.suggestions,
      };
    }),
});

export type MetapromptRouter = typeof metapromptRouter;
