import { z } from "zod";
import { eq, and, desc, sql, like, or, inArray } from "drizzle-orm";
import { router, protectedProcedure, ownerProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { documents, users } from "../../drizzle/schema";
import { storagePut } from "../storage";

export const documentsRouter = router({
  // ==========================================
  // USER: Dokument hochladen
  // ==========================================
  upload: protectedProcedure
    .input(z.object({
      fileName: z.string().min(1).max(255),
      fileData: z.string(), // Base64-encoded
      mimeType: z.string().default("application/octet-stream"),
      description: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      
      // Base64 zu Buffer konvertieren
      const fileBuffer = Buffer.from(input.fileData, "base64");
      const fileSize = fileBuffer.length;
      
      // Max 50MB
      if (fileSize > 50 * 1024 * 1024) {
        throw new Error("Datei zu groß. Maximale Größe: 50 MB");
      }
      
      // Eindeutigen Dateinamen generieren
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageKey = `user-uploads/${ctx.user.id}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;
      
      // In S3 hochladen
      const { url } = await storagePut(storageKey, fileBuffer, input.mimeType);
      
      // In Datenbank speichern
      const result = await db.insert(documents).values({
        userId: ctx.user.id,
        fileName: sanitizedFileName,
        originalFileName: input.fileName,
        fileUrl: url,
        fileSize: fileSize,
        mimeType: input.mimeType,
        category: "upload",
        description: input.description,
        uploadedAt: new Date(),
      });
      
      // insertId aus dem Result extrahieren
      const insertId = (result as unknown as { insertId: number }[])[0]?.insertId || 0;
      
      return {
        success: true,
        id: insertId,
        fileName: sanitizedFileName,
        fileUrl: url,
        fileSize: fileSize,
      };
    }),

  // ==========================================
  // USER: Eigene Dokumente auflisten
  // ==========================================
  list: protectedProcedure
    .input(z.object({
      type: z.enum(["all", "upload", "result"]).default("all"),
      search: z.string().optional(),
      sortBy: z.enum(["date", "name", "size"]).default("date"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      
      const { type = "all", search, sortBy = "date", sortOrder = "desc", limit = 50, offset = 0 } = input || {};
      
      // Basis-Bedingung: Nur eigene Dokumente
      const conditions = [eq(documents.userId, ctx.user.id)];
      
      // Typ-Filter (Upload vs Ergebnis)
      if (type === "upload") {
        conditions.push(or(
          eq(documents.category, "upload"),
          sql`${documents.category} IS NULL`
        )!);
      } else if (type === "result") {
        conditions.push(eq(documents.category, "result"));
      }
      
      // Suche
      if (search) {
        conditions.push(or(
          like(documents.fileName, `%${search}%`),
          like(documents.originalFileName, `%${search}%`),
          like(documents.description, `%${search}%`)
        )!);
      }
      
      // Sortierung
      const orderBy = sortBy === "date" 
        ? (sortOrder === "desc" ? desc(documents.uploadedAt) : documents.uploadedAt)
        : sortBy === "name"
        ? (sortOrder === "desc" ? desc(documents.fileName) : documents.fileName)
        : (sortOrder === "desc" ? desc(documents.fileSize) : documents.fileSize);
      
      // Abfrage
      const [docs, countResult] = await Promise.all([
        db.select()
          .from(documents)
          .where(and(...conditions))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`COUNT(*)` })
          .from(documents)
          .where(and(...conditions))
      ]);
      
      return {
        documents: docs,
        total: countResult[0]?.count || 0,
        hasMore: offset + docs.length < (countResult[0]?.count || 0)
      };
    }),

  // ==========================================
  // USER: Dokument-Details abrufen
  // ==========================================
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      
      const doc = await db.select()
        .from(documents)
        .where(and(
          eq(documents.id, input.id),
          eq(documents.userId, ctx.user.id)
        ))
        .limit(1);
      
      if (!doc[0]) {
        throw new Error("Dokument nicht gefunden");
      }
      
      return doc[0];
    }),

  // ==========================================
  // USER: Dokument löschen
  // ==========================================
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      
      // Prüfen ob Dokument existiert und dem User gehört
      const doc = await db.select()
        .from(documents)
        .where(and(
          eq(documents.id, input.id),
          eq(documents.userId, ctx.user.id)
        ))
        .limit(1);
      
      if (!doc[0]) {
        throw new Error("Dokument nicht gefunden oder keine Berechtigung");
      }
      
      await db.delete(documents).where(eq(documents.id, input.id));
      
      return { success: true };
    }),

  // ==========================================
  // USER: Mehrere Dokumente löschen
  // ==========================================
  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      
      if (input.ids.length === 0) {
        return { deleted: 0 };
      }
      
      await db.delete(documents)
        .where(and(
          inArray(documents.id, input.ids),
          eq(documents.userId, ctx.user.id)
        ));
      
      return { deleted: input.ids.length };
    }),

  // ==========================================
  // USER: Speicherplatz-Statistiken
  // ==========================================
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      
      const stats = await db.select({
        totalCount: sql<number>`COUNT(*)`,
        totalSize: sql<number>`COALESCE(SUM(${documents.fileSize}), 0)`,
        uploadCount: sql<number>`SUM(CASE WHEN ${documents.category} = 'upload' OR ${documents.category} IS NULL THEN 1 ELSE 0 END)`,
        resultCount: sql<number>`SUM(CASE WHEN ${documents.category} = 'result' THEN 1 ELSE 0 END)`,
      })
      .from(documents)
      .where(eq(documents.userId, ctx.user.id));
      
      const result = stats[0];
      
      const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      };
      
      return {
        totalCount: result?.totalCount || 0,
        totalSize: result?.totalSize || 0,
        totalSizeFormatted: formatSize(result?.totalSize || 0),
        uploadCount: result?.uploadCount || 0,
        resultCount: result?.resultCount || 0,
      };
    }),

  // ==========================================
  // USER: Dokument-Beschreibung aktualisieren
  // ==========================================
  updateDescription: protectedProcedure
    .input(z.object({
      id: z.number(),
      description: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      
      const doc = await db.select()
        .from(documents)
        .where(and(
          eq(documents.id, input.id),
          eq(documents.userId, ctx.user.id)
        ))
        .limit(1);
      
      if (!doc[0]) {
        throw new Error("Dokument nicht gefunden oder keine Berechtigung");
      }
      
      await db.update(documents)
        .set({ description: input.description })
        .where(eq(documents.id, input.id));
      
      return { success: true };
    }),

  // ==========================================
  // OWNER: Alle Dokumente aller User
  // ==========================================
  listAll: ownerProcedure
    .input(z.object({
      userId: z.number().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      
      const { userId, search, limit = 50, offset = 0 } = input || {};
      
      const conditions: ReturnType<typeof eq>[] = [];
      
      if (userId) {
        conditions.push(eq(documents.userId, userId));
      }
      
      if (search) {
        conditions.push(or(
          like(documents.fileName, `%${search}%`),
          like(documents.originalFileName, `%${search}%`)
        )!);
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      const [docs, countResult] = await Promise.all([
        db.select({
          document: documents,
          userName: users.name,
          userEmail: users.email,
        })
        .from(documents)
        .leftJoin(users, eq(documents.userId, users.id))
        .where(whereClause)
        .orderBy(desc(documents.uploadedAt))
        .limit(limit)
        .offset(offset),
        db.select({ count: sql<number>`COUNT(*)` })
          .from(documents)
          .where(whereClause)
      ]);
      
      return {
        documents: docs.map((d: { document: typeof documents.$inferSelect; userName: string | null; userEmail: string | null }) => ({
          ...d.document,
          userName: d.userName,
          userEmail: d.userEmail,
        })),
        total: countResult[0]?.count || 0,
      };
    }),

  // ==========================================
  // OWNER: Globale Speicherplatz-Statistiken
  // ==========================================
  getGlobalStats: ownerProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Datenbank nicht verfügbar");
      
      const stats = await db.select({
        totalCount: sql<number>`COUNT(*)`,
        totalSize: sql<number>`COALESCE(SUM(${documents.fileSize}), 0)`,
        uniqueUsers: sql<number>`COUNT(DISTINCT ${documents.userId})`,
      })
      .from(documents);
      
      const result = stats[0];
      
      const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      };
      
      return {
        totalCount: result?.totalCount || 0,
        totalSize: result?.totalSize || 0,
        totalSizeFormatted: formatSize(result?.totalSize || 0),
        uniqueUsers: result?.uniqueUsers || 0,
      };
    }),
});
