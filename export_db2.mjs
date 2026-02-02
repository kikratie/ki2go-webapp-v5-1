import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

async function exportAllTables() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  const tables = [
    { name: "users", query: "SELECT id, openId, name, email, role, organizationId, lastSignedIn, createdAt FROM users" },
    { name: "organizations", query: "SELECT * FROM organizations" },
    { name: "organizationMembers", query: "SELECT * FROM organizationMembers" },
    { name: "categories", query: "SELECT * FROM categories" },
    { name: "businessAreas", query: "SELECT * FROM businessAreas" },
    { name: "taskTemplates", query: "SELECT id, name, category, businessArea, isActive, createdAt FROM taskTemplates" },
    { name: "metapromptTemplates", query: "SELECT id, name, category, isActive, createdAt FROM metapromptTemplates" },
    { name: "workflowExecutions", query: "SELECT id, userId, templateId, status, inputTokens, outputTokens, totalCost, startedAt, completedAt FROM workflowExecutions" },
    { name: "subscriptionPlans", query: "SELECT * FROM subscriptionPlans" },
    { name: "organizationSubscriptions", query: "SELECT * FROM organizationSubscriptions" },
    { name: "organizationInvitations", query: "SELECT * FROM organizationInvitations" },
    { name: "creditTransactions", query: "SELECT * FROM creditTransactions" },
    { name: "processAuditLog", query: "SELECT * FROM processAuditLog" },
    { name: "documentUsage", query: "SELECT * FROM documentUsage" },
    { name: "documents", query: "SELECT id, userId, fileName, fileType, fileSize, createdAt FROM documents" },
    { name: "taskRequests", query: "SELECT id, description, status, contactEmail, createdAt FROM taskRequests" },
    { name: "workflowFeedback", query: "SELECT * FROM workflowFeedback" },
  ];
  
  for (const table of tables) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`TABLE: ${table.name}`);
    console.log("=".repeat(60));
    try {
      const [rows] = await connection.execute(table.query);
      console.log(`Rows: ${rows.length}`);
      if (rows.length > 0) {
        console.table(rows);
      } else {
        console.log("(empty)");
      }
    } catch (err) {
      console.log(`Error: ${err.message}`);
    }
  }
  
  await connection.end();
}

exportAllTables().catch(console.error);
