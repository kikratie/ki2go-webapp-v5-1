import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const [rows] = await connection.execute("SELECT id, name, email, role, organizationId, createdAt FROM users ORDER BY role DESC, id ASC");
console.log("=== ALLE USER ===");
console.log(JSON.stringify(rows, null, 2));
await connection.end();
