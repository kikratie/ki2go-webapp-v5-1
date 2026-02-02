import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { documents } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";
import { randomUUID } from "crypto";
// @ts-ignore - pdf-parse hat keine TypeScript-Definitionen
import pdfParse from "pdf-parse";

// Helper: Extrahiere Text aus verschiedenen Dateitypen
const extractTextFromFile = async (
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ text: string; pageCount?: number }> => {
  // Für TXT-Dateien: Direkt als Text lesen
  if (mimeType === "text/plain") {
    return { text: buffer.toString("utf-8") };
  }

  // Für PDF: Verwende pdf-parse für zuverlässige Text-Extraktion
  if (mimeType === "application/pdf") {
    try {
      console.log("[PDF Parse] Starting extraction for:", fileName);
      const pdfData = await pdfParse(buffer);
      
      const extractedText = pdfData.text || "";
      const pageCount = pdfData.numpages || 1;
      
      console.log("[PDF Parse] Extracted", extractedText.length, "characters from", pageCount, "pages");
      
      if (extractedText.length < 100) {
        // Wahrscheinlich gescanntes PDF - gib Warnung zurück
        return { 
          text: `[WARNUNG: Dieses PDF scheint ein gescanntes Dokument zu sein. Der Text konnte nicht vollständig extrahiert werden. Bitte verwenden Sie ein maschinenlesbares PDF oder ein Word-Dokument.]\n\n${extractedText}`,
          pageCount 
        };
      }

      return { text: extractedText, pageCount };
    } catch (error: any) {
      console.error("[PDF Parse] Extraction error:", error.message);
      return { text: `[Fehler bei der PDF-Textextraktion: ${error.message}]` };
    }
  }

  // Für DOCX: Extrahiere Text aus XML
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    try {
      // DOCX ist ein ZIP-Archiv - wir müssen es entpacken
      // Für jetzt: Versuche direkten Text zu finden
      const docxContent = buffer.toString("utf-8");
      
      // Suche nach Text in <w:t> Tags
      const textMatches: string[] = [];
      const wtRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let match;
      
      while ((match = wtRegex.exec(docxContent)) !== null) {
        if (match[1].trim()) {
          textMatches.push(match[1]);
        }
      }

      // Fallback: Suche nach lesbarem Text
      if (textMatches.length === 0) {
        const readableText = docxContent
          .replace(/<[^>]+>/g, " ")
          .replace(/[^\x20-\x7E\n\r\täöüÄÖÜß]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return { text: readableText };
      }

      return { text: textMatches.join(" ") };
    } catch (error) {
      console.error("DOCX extraction error:", error);
      return { text: "[Fehler bei der DOCX-Textextraktion]" };
    }
  }

  return { text: "[Nicht unterstütztes Dateiformat]" };
};

export const documentRouter = router({
  // Dokument hochladen
  upload: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // Base64-encoded
      mimeType: z.string(),
      category: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log("[Document Upload] Starting upload for:", input.fileName, "Type:", input.mimeType, "Size:", input.fileData.length, "bytes (base64)");
      
      const db = await getDb();
      if (!db) {
        console.error("[Document Upload] Database connection failed");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Datenbankverbindung fehlgeschlagen" });
      }
      console.log("[Document Upload] Database connected");

      // Validiere Dateityp
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
      ];
      
      if (!allowedTypes.includes(input.mimeType)) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Nur PDF, DOCX und TXT Dateien sind erlaubt" 
        });
      }

      // Dekodiere Base64
      const buffer = Buffer.from(input.fileData, "base64");
      
      // Validiere Dateigröße (max 10MB)
      if (buffer.length > 10 * 1024 * 1024) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Datei zu groß (max. 10MB)" 
        });
      }

      // Generiere eindeutigen Dateinamen
      const fileExt = input.fileName.split(".").pop() || "bin";
      const uniqueFileName = `${ctx.user.id}-docs/${Date.now()}-${randomUUID().slice(0, 8)}.${fileExt}`;

      // Upload zu S3
      console.log("[Document Upload] Uploading to S3:", uniqueFileName);
      let url: string;
      let key: string;
      try {
        const result = await storagePut(uniqueFileName, buffer, input.mimeType);
        url = result.url;
        key = result.key;
        console.log("[Document Upload] S3 upload successful:", url);
      } catch (storageError: any) {
        console.error("[Document Upload] S3 upload failed:", storageError.message);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: `Datei-Upload fehlgeschlagen: ${storageError.message}` 
        });
      }

      // Extrahiere Text
      const { text: rawExtractedText, pageCount } = await extractTextFromFile(
        buffer,
        input.mimeType,
        input.fileName
      );
      
      // Bereinige den Text für die Datenbank (entferne problematische Zeichen)
      const extractedText = rawExtractedText
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Entferne Steuerzeichen
        .replace(/\\u0000/g, '') // Entferne Null-Bytes
        .slice(0, 65000); // Begrenze auf 65KB für TEXT-Feld

      // Speichere in Datenbank
      console.log("[Document Upload] Saving to database...");
      let result;
      try {
        result = await db.insert(documents).values({
        userId: ctx.user.id,
        fileName: uniqueFileName,
        originalFileName: input.fileName,
        fileUrl: url,
        fileKey: key,
        fileSize: buffer.length,
        mimeType: input.mimeType,
        extractedText,
        pageCount,
        category: input.category,
        description: input.description,
      });

      } catch (dbError: any) {
        console.error("[Document Upload] Database insert failed:", dbError.message);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: `Datenbank-Fehler: ${dbError.message}` 
        });
      }
      
      const documentId = Number(result[0].insertId);
      console.log("[Document Upload] Document saved with ID:", documentId);

      return {
        id: documentId,
        fileName: input.fileName,
        fileUrl: url,
        fileSize: buffer.length,
        extractedText: extractedText.slice(0, 500) + (extractedText.length > 500 ? "..." : ""),
        pageCount,
        isReadable: !extractedText.includes("[WARNUNG:") && extractedText.length > 100,
      };
    }),

  // Mehrere Dokumente hochladen
  uploadMultiple: protectedProcedure
    .input(z.object({
      files: z.array(z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64-encoded
        mimeType: z.string(),
      })),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const results = [];
      
      for (const file of input.files) {
        try {
          const db = await getDb();
          if (!db) continue;

          // Validiere Dateityp
          const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
          ];
          
          if (!allowedTypes.includes(file.mimeType)) {
            results.push({
              fileName: file.fileName,
              success: false,
              error: "Nicht unterstütztes Dateiformat",
            });
            continue;
          }

          // Dekodiere Base64
          const buffer = Buffer.from(file.fileData, "base64");
          
          // Validiere Dateigröße
          if (buffer.length > 10 * 1024 * 1024) {
            results.push({
              fileName: file.fileName,
              success: false,
              error: "Datei zu groß",
            });
            continue;
          }

          // Generiere eindeutigen Dateinamen
          const fileExt = file.fileName.split(".").pop() || "bin";
          const uniqueFileName = `${ctx.user.id}-docs/${Date.now()}-${randomUUID().slice(0, 8)}.${fileExt}`;

          // Upload zu S3
          const { url, key } = await storagePut(uniqueFileName, buffer, file.mimeType);

          // Extrahiere Text
          const { text: extractedText, pageCount } = await extractTextFromFile(
            buffer,
            file.mimeType,
            file.fileName
          );

          // Speichere in Datenbank
          const result = await db.insert(documents).values({
            userId: ctx.user.id,
            fileName: uniqueFileName,
            originalFileName: file.fileName,
            fileUrl: url,
            fileKey: key,
            fileSize: buffer.length,
            mimeType: file.mimeType,
            extractedText,
            pageCount,
            category: input.category,
          });

          results.push({
            id: Number(result[0].insertId),
            fileName: file.fileName,
            fileUrl: url,
            fileSize: buffer.length,
            extractedTextPreview: extractedText.slice(0, 200),
            pageCount,
            isReadable: !extractedText.includes("[WARNUNG:") && extractedText.length > 100,
            success: true,
          });
        } catch (error) {
          results.push({
            fileName: file.fileName,
            success: false,
            error: error instanceof Error ? error.message : "Unbekannter Fehler",
          });
        }
      }

      return { results };
    }),

  // Meine Dokumente abrufen
  getMyDocuments: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const limit = input?.limit || 20;
      const offset = input?.offset || 0;

      const docs = await db
        .select({
          id: documents.id,
          fileName: documents.originalFileName,
          fileUrl: documents.fileUrl,
          fileSize: documents.fileSize,
          mimeType: documents.mimeType,
          pageCount: documents.pageCount,
          category: documents.category,
          uploadedAt: documents.uploadedAt,
        })
        .from(documents)
        .where(eq(documents.userId, ctx.user.id))
        .orderBy(desc(documents.uploadedAt))
        .limit(limit)
        .offset(offset);

      return docs;
    }),

  // Dokument-Details abrufen (inkl. extrahiertem Text)
  getDocument: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const doc = await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, input.id),
          eq(documents.userId, ctx.user.id)
        ))
        .limit(1);

      if (!doc.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dokument nicht gefunden" });
      }

      return doc[0];
    }),

  // Dokument löschen
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Prüfe ob Dokument dem User gehört
      const doc = await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, input.id),
          eq(documents.userId, ctx.user.id)
        ))
        .limit(1);

      if (!doc.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dokument nicht gefunden" });
      }

      // Lösche aus Datenbank (S3-Datei bleibt - könnte später bereinigt werden)
      await db.delete(documents).where(eq(documents.id, input.id));

      return { success: true };
    }),
});
