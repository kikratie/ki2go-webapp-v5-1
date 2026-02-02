import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute('SELECT id, name, email, role FROM users');
console.log('Benutzer in der Datenbank:');
rows.forEach(row => {
  console.log(`- ID: ${row.id}, Name: ${row.name}, Email: ${row.email}, Rolle: ${row.role}`);
});
await connection.end();
