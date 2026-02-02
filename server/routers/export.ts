import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { workflowExecutions, taskTemplates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const exportRouter = router({
  // Ergebnis als TXT exportieren
  exportTxt: protectedProcedure
    .input(z.object({
      executionId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const [execution] = await db
        .select()
        .from(workflowExecutions)
        .where(
          and(
            eq(workflowExecutions.id, input.executionId),
            eq(workflowExecutions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!execution) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ergebnis nicht gefunden" });
      }

      // Lade Template-Infos
      let templateName = "Aufgabe";
      if (execution.templateId) {
        const [template] = await db
          .select({ name: taskTemplates.name, title: taskTemplates.title })
          .from(taskTemplates)
          .where(eq(taskTemplates.id, execution.templateId))
          .limit(1);
        if (template) {
          templateName = template.title || template.name;
        }
      }

      const date = new Date(execution.startedAt || new Date()).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const content = `${templateName}
${"=".repeat(templateName.length)}

Erstellt am: ${date}
Status: ${execution.status === "completed" ? "Abgeschlossen" : execution.status}

---

${execution.result || "Kein Ergebnis verfügbar."}

---
Generiert von KI2GO - Wir liefern Ergebnisse
`;

      return {
        content,
        fileName: `${templateName.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`,
        mimeType: "text/plain",
      };
    }),

  // Ergebnis als Markdown exportieren (für PDF-Konvertierung)
  exportMarkdown: protectedProcedure
    .input(z.object({
      executionId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const [execution] = await db
        .select()
        .from(workflowExecutions)
        .where(
          and(
            eq(workflowExecutions.id, input.executionId),
            eq(workflowExecutions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!execution) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ergebnis nicht gefunden" });
      }

      // Lade Template-Infos
      let templateName = "Aufgabe";
      if (execution.templateId) {
        const [template] = await db
          .select({ name: taskTemplates.name, title: taskTemplates.title })
          .from(taskTemplates)
          .where(eq(taskTemplates.id, execution.templateId))
          .limit(1);
        if (template) {
          templateName = template.title || template.name;
        }
      }

      const date = new Date(execution.startedAt || new Date()).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const content = `# ${templateName}

**Erstellt am:** ${date}  
**Status:** ${execution.status === "completed" ? "Abgeschlossen" : execution.status}

---

${execution.result || "Kein Ergebnis verfügbar."}

---

*Generiert von KI2GO - Wir liefern Ergebnisse*
`;

      return {
        content,
        fileName: `${templateName.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "_")}_${new Date().toISOString().split("T")[0]}.md`,
        mimeType: "text/markdown",
      };
    }),

  // Ergebnis als HTML exportieren (für DOCX-Konvertierung)
  exportHtml: protectedProcedure
    .input(z.object({
      executionId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const [execution] = await db
        .select()
        .from(workflowExecutions)
        .where(
          and(
            eq(workflowExecutions.id, input.executionId),
            eq(workflowExecutions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!execution) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ergebnis nicht gefunden" });
      }

      // Lade Template-Infos
      let templateName = "Aufgabe";
      if (execution.templateId) {
        const [template] = await db
          .select({ name: taskTemplates.name, title: taskTemplates.title })
          .from(taskTemplates)
          .where(eq(taskTemplates.id, execution.templateId))
          .limit(1);
        if (template) {
          templateName = template.title || template.name;
        }
      }

      const date = new Date(execution.startedAt || new Date()).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Konvertiere Markdown zu HTML (einfache Konvertierung)
      const resultHtml = (execution.result || "Kein Ergebnis verfügbar.")
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

      const content = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${templateName}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #1E3A5F; border-bottom: 2px solid #5FBDCE; padding-bottom: 10px; }
    h2, h3 { color: #1E3A5F; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
    .footer { color: #999; font-size: 12px; text-align: center; margin-top: 40px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 5px; }
  </style>
</head>
<body>
  <h1>${templateName}</h1>
  <div class="meta">
    <strong>Erstellt am:</strong> ${date}<br>
    <strong>Status:</strong> ${execution.status === "completed" ? "Abgeschlossen" : execution.status}
  </div>
  <hr>
  <div class="content">
    <p>${resultHtml}</p>
  </div>
  <hr>
  <div class="footer">
    Generiert von KI2GO - Wir liefern Ergebnisse
  </div>
</body>
</html>`;

      return {
        content,
        fileName: `${templateName.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "_")}_${new Date().toISOString().split("T")[0]}.html`,
        mimeType: "text/html",
      };
    }),

  // Ergebnis als PDF exportieren
  exportPdf: protectedProcedure
    .input(z.object({
      executionId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB nicht verfügbar" });

      const [execution] = await db
        .select()
        .from(workflowExecutions)
        .where(
          and(
            eq(workflowExecutions.id, input.executionId),
            eq(workflowExecutions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!execution) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ergebnis nicht gefunden" });
      }

      // Lade Template-Infos
      let templateName = "Aufgabe";
      if (execution.templateId) {
        const [template] = await db
          .select({ name: taskTemplates.name, title: taskTemplates.title })
          .from(taskTemplates)
          .where(eq(taskTemplates.id, execution.templateId))
          .limit(1);
        if (template) {
          templateName = template.title || template.name;
        }
      }

      const date = new Date(execution.startedAt || new Date()).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Professionelle Markdown zu HTML Konvertierung mit Tabellen-Support
      const convertMarkdownToHtml = (markdown: string): string => {
        let html = markdown;
        
        // Tabellen konvertieren (Markdown-Tabellen)
        const tableRegex = /^\|(.+)\|\s*\n\|[-:|\s]+\|\s*\n((?:\|.+\|\s*\n?)+)/gm;
        html = html.replace(tableRegex, (match, headerRow, bodyRows) => {
          const headers = headerRow.split('|').map((h: string) => h.trim()).filter((h: string) => h);
          const rows = bodyRows.trim().split('\n').map((row: string) => 
            row.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell)
          );
          
          let tableHtml = '<table class="result-table"><thead><tr>';
          headers.forEach((h: string) => {
            tableHtml += `<th>${h}</th>`;
          });
          tableHtml += '</tr></thead><tbody>';
          rows.forEach((row: string[]) => {
            tableHtml += '<tr>';
            row.forEach((cell: string) => {
              // Status-Badges für Tabellenzellen
              let cellContent = cell;
              if (cell.includes('✅') || cell.toLowerCase().includes('ok') || cell.toLowerCase().includes('erfüllt')) {
                cellContent = `<span class="status-ok">${cell}</span>`;
              } else if (cell.includes('⚠') || cell.toLowerCase().includes('warnung') || cell.toLowerCase().includes('prüfen')) {
                cellContent = `<span class="status-warning">${cell}</span>`;
              } else if (cell.includes('❌') || cell.toLowerCase().includes('fehlt') || cell.toLowerCase().includes('kritisch')) {
                cellContent = `<span class="status-error">${cell}</span>`;
              }
              tableHtml += `<td>${cellContent}</td>`;
            });
            tableHtml += '</tr>';
          });
          tableHtml += '</tbody></table>';
          return tableHtml;
        });
        
        // Überschriften
        html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Fett und Kursiv
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Code-Blöcke
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code class="inline">$1</code>');
        
        // Nummerierte Listen
        html = html.replace(/^(\d+)\. (.*$)/gm, '<li class="numbered">$2</li>');
        
        // Aufzählungslisten
        html = html.replace(/^[\-\*] (.*$)/gm, '<li>$1</li>');
        
        // Listen gruppieren (ohne 's' Flag für ES2017 Kompatibilität)
        html = html.replace(/(<li class="numbered">[^<]*<\/li>\n?)+/g, '<ol>$&</ol>');
        html = html.replace(/(<li>[^<]*<\/li>\n?)+/g, '<ul>$&</ul>');
        
        // Horizontale Linien
        html = html.replace(/^---$/gm, '<hr>');
        html = html.replace(/^\*\*\*$/gm, '<hr>');
        
        // Blockquotes
        html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
        
        // Absätze
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        // Bereinigung
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<h[1-4]>)/g, '$1');
        html = html.replace(/(<\/h[1-4]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<table)/g, '$1');
        html = html.replace(/(<\/table>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>|<ol>)/g, '$1');
        html = html.replace(/(<\/ul>|<\/ol>)<\/p>/g, '$1');
        html = html.replace(/<p>(<hr>)/g, '$1');
        html = html.replace(/(<hr>)<\/p>/g, '$1');
        html = html.replace(/<p>(<blockquote>)/g, '$1');
        html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
        
        return html;
      };

      const resultHtml = convertMarkdownToHtml(execution.result || "Kein Ergebnis verfügbar.");

      // Professionelles HTML für PDF mit vollständigem Styling
      const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${templateName}</title>
  <style>
    @page { 
      margin: 2cm; 
      size: A4; 
      @bottom-center {
        content: "Seite " counter(page) " von " counter(pages);
        font-size: 9pt;
        color: #999;
      }
    }
    
    * { box-sizing: border-box; }
    
    body { 
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
      font-size: 10.5pt;
      line-height: 1.6; 
      color: #2c3e50;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    
    /* Header */
    .header { 
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #5FBDCE; 
      padding-bottom: 15px; 
      margin-bottom: 25px; 
    }
    .header-left h1 { 
      color: #1E3A5F; 
      font-size: 20pt; 
      margin: 0 0 5px 0;
      font-weight: 600;
    }
    .header-left .subtitle {
      color: #5FBDCE;
      font-size: 10pt;
      font-weight: 500;
    }
    .header-right { 
      text-align: right;
    }
    .header-right .logo { 
      color: #1E3A5F; 
      font-size: 14pt; 
      font-weight: 700;
      letter-spacing: 1px;
    }
    .header-right .tagline {
      color: #5FBDCE;
      font-size: 8pt;
      margin-top: 2px;
    }
    
    /* Meta-Info Box */
    .meta { 
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 15px 20px; 
      border-radius: 8px; 
      margin-bottom: 25px; 
      font-size: 9.5pt;
      border-left: 4px solid #5FBDCE;
    }
    .meta-row {
      display: flex;
      gap: 30px;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .meta-label { 
      color: #6c757d;
      font-weight: 500;
    }
    .meta-value { 
      color: #1E3A5F; 
      font-weight: 600;
    }
    .status-badge {
      background: #d4edda;
      color: #155724;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: 600;
    }
    
    /* Content */
    .content { 
      margin-top: 20px; 
    }
    .content p { 
      margin: 12px 0; 
      text-align: justify;
    }
    
    /* Überschriften */
    .content h1 { 
      color: #1E3A5F; 
      font-size: 16pt; 
      margin: 30px 0 15px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e9ecef;
    }
    .content h2 { 
      color: #1E3A5F; 
      font-size: 14pt; 
      margin: 25px 0 12px 0;
      padding-bottom: 5px;
      border-bottom: 1px solid #e9ecef;
    }
    .content h3 { 
      color: #2c3e50; 
      font-size: 12pt; 
      margin: 20px 0 10px 0;
    }
    .content h4 { 
      color: #495057; 
      font-size: 11pt; 
      margin: 15px 0 8px 0;
    }
    
    /* Listen */
    .content ul, .content ol { 
      padding-left: 25px; 
      margin: 15px 0; 
    }
    .content li { 
      margin-bottom: 8px; 
      padding-left: 5px;
    }
    .content ul li::marker {
      color: #5FBDCE;
    }
    .content ol li::marker {
      color: #1E3A5F;
      font-weight: 600;
    }
    
    /* Tabellen */
    .result-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0; 
      font-size: 9.5pt;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .result-table th { 
      background: linear-gradient(135deg, #1E3A5F 0%, #2c5282 100%);
      color: white;
      padding: 12px 15px; 
      text-align: left; 
      font-weight: 600;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .result-table td { 
      border: 1px solid #dee2e6; 
      padding: 10px 15px; 
      vertical-align: top;
    }
    .result-table tr:nth-child(even) {
      background: #f8f9fa;
    }
    .result-table tr:hover {
      background: #e9ecef;
    }
    
    /* Status-Badges in Tabellen */
    .status-ok {
      background: #d4edda;
      color: #155724;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 9pt;
    }
    .status-warning {
      background: #fff3cd;
      color: #856404;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 9pt;
    }
    .status-error {
      background: #f8d7da;
      color: #721c24;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 9pt;
    }
    
    /* Code */
    pre {
      background: #2d3748;
      color: #e2e8f0;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 9pt;
      line-height: 1.4;
    }
    code.inline {
      background: #e9ecef;
      color: #e83e8c;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 9pt;
    }
    
    /* Blockquotes */
    blockquote {
      border-left: 4px solid #5FBDCE;
      margin: 20px 0;
      padding: 15px 20px;
      background: #f8f9fa;
      font-style: italic;
      color: #495057;
    }
    
    /* Horizontale Linie */
    hr {
      border: none;
      border-top: 2px solid #e9ecef;
      margin: 25px 0;
    }
    
    /* Footer */
    .footer { 
      margin-top: 50px; 
      padding-top: 20px; 
      border-top: 2px solid #e9ecef; 
      text-align: center; 
      font-size: 9pt; 
      color: #6c757d; 
    }
    .footer .brand { 
      color: #1E3A5F; 
      font-weight: 700;
      font-size: 11pt;
      letter-spacing: 1px;
    }
    .footer .tagline {
      color: #5FBDCE;
      font-size: 8pt;
      margin-top: 3px;
    }
    .footer .website {
      color: #5FBDCE;
      font-size: 9pt;
      margin-top: 8px;
    }
    
    /* Print-spezifisch */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .result-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .status-ok, .status-warning, .status-error { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>${templateName}</h1>
      <div class="subtitle">Analysebericht</div>
    </div>
    <div class="header-right">
      <div class="logo">KI2GO</div>
      <div class="tagline">Wir liefern Ergebnisse</div>
    </div>
  </div>
  
  <div class="meta">
    <div class="meta-row">
      <div class="meta-item">
        <span class="meta-label">Erstellt am:</span>
        <span class="meta-value">${date}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Status:</span>
        <span class="status-badge">${execution.status === "completed" ? "✅ Abgeschlossen" : execution.status}</span>
      </div>
    </div>
  </div>
  
  <div class="content">
    <p>${resultHtml}</p>
  </div>
  
  <div class="footer">
    <div class="brand">KI2GO</div>
    <div class="tagline">Wir liefern Ergebnisse</div>
    <div class="website">www.ki2go.at</div>
  </div>
</body>
</html>`;

      return {
        htmlContent,
        fileName: `${templateName.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
        mimeType: "application/pdf",
      };
    }),
});
