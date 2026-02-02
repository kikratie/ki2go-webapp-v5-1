import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./drizzle/schema.js";
import fs from "fs";

const DATABASE_URL = process.env.DATABASE_URL;

async function exportData() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection, { schema, mode: "default" });
  
  const exportData = {};
  
  // Export categories
  const categories = await db.select().from(schema.categories);
  exportData.categories = categories;
  console.log(`Exported ${categories.length} categories`);
  
  // Export businessAreas
  const businessAreas = await db.select().from(schema.businessAreas);
  exportData.businessAreas = businessAreas;
  console.log(`Exported ${businessAreas.length} businessAreas`);
  
  // Export metapromptTemplates
  const metapromptTemplates = await db.select().from(schema.metapromptTemplates);
  exportData.metapromptTemplates = metapromptTemplates;
  console.log(`Exported ${metapromptTemplates.length} metapromptTemplates`);
  
  // Export superpromptCollection (die eigentlichen Templates)
  const superprompts = await db.select().from(schema.superpromptCollection);
  exportData.superpromptCollection = superprompts;
  console.log(`Exported ${superprompts.length} superprompts`);
  
  // Export pricingPlans
  const pricingPlans = await db.select().from(schema.pricingPlans);
  exportData.pricingPlans = pricingPlans;
  console.log(`Exported ${pricingPlans.length} pricingPlans`);
  
  // Write to file
  fs.writeFileSync("/home/ubuntu/ki2go-export/database-export.json", JSON.stringify(exportData, null, 2));
  console.log("\nExport saved to /home/ubuntu/ki2go-export/database-export.json");
  
  await connection.end();
}

exportData().catch(console.error);
