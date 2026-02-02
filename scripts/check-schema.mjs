import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [columns] = await connection.execute("DESCRIBE users");
console.log("=== USERS TABLE COLUMNS ===");
columns.forEach(col => console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`));
await connection.end();
