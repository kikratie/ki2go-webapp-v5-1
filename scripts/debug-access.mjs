import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, like, or, and, sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("=== Benutzer mit 'niaghi' oder 'proagentur' ===");
  const users = await db.execute(sql`
    SELECT id, name, email, role, organizationId 
    FROM users 
    WHERE email LIKE '%niaghi%' OR email LIKE '%proagentur%'
  `);
  console.table(users[0]);

  // Finde das Vertrags-Analyse Template
  console.log("\n=== Vertrags-Analyse Template ===");
  const templates = await db.execute(sql`
    SELECT id, slug, title, templateStatus, isPublic, organizationId, createdBy
    FROM taskTemplates 
    WHERE title LIKE '%Vertrag%' OR slug LIKE '%vertrag%'
  `);
  console.table(templates[0]);

  // Prüfe Template-Zuweisungen
  if (templates[0].length > 0) {
    const templateId = templates[0][0].id;
    console.log(`\n=== Template-Zuweisungen für Template ID ${templateId} ===`);
    const assignments = await db.execute(sql`
      SELECT ta.*, u.email as userEmail, o.name as orgName
      FROM templateAssignments ta
      LEFT JOIN users u ON ta.userId = u.id
      LEFT JOIN organizations o ON ta.organizationId = o.id
      WHERE ta.templateId = ${templateId}
    `);
    console.table(assignments[0]);
  }

  // Prüfe Custom Superprompts für das Template
  console.log("\n=== Custom Superprompts für Vertrags-Analyse ===");
  const customSuperprompts = await db.execute(sql`
    SELECT cs.id, cs.uniqueId, cs.name, cs.userId, cs.organizationId, cs.isActive, u.email
    FROM customSuperprompts cs
    LEFT JOIN users u ON cs.userId = u.id
    WHERE cs.name LIKE '%Vertrag%'
  `);
  console.table(customSuperprompts[0]);

  // Prüfe ob der Benutzer einer Organisation angehört
  if (users[0].length > 0) {
    const userId = users[0][0].id;
    const orgId = users[0][0].organizationId;
    
    console.log(`\n=== Organisation-Mitgliedschaft für User ${userId} ===`);
    const membership = await db.execute(sql`
      SELECT om.*, o.name as orgName
      FROM organizationMembers om
      LEFT JOIN organizations o ON om.organizationId = o.id
      WHERE om.userId = ${userId}
    `);
    console.table(membership[0]);

    if (orgId) {
      console.log(`\n=== Template-Zuweisungen für Organisation ${orgId} ===`);
      const orgAssignments = await db.execute(sql`
        SELECT ta.*, t.title as templateTitle
        FROM templateAssignments ta
        LEFT JOIN taskTemplates t ON ta.templateId = t.id
        WHERE ta.organizationId = ${orgId}
      `);
      console.table(orgAssignments[0]);
    }
  }

  await connection.end();
}

main().catch(console.error);
