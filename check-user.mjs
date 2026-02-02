import mysql from 'mysql2/promise';

// Parse DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse: mysql://user:pass@host:port/database?params
const url = new URL(dbUrl);
const user = url.username;
const password = url.password;
const host = url.hostname;
const port = parseInt(url.port);
const database = url.pathname.slice(1); // Remove leading /

console.log('Connecting to:', host, port, database);

async function main() {
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false }
  });

  // Alle User mit proagentur oder niaghi
  const [users] = await connection.execute(`
    SELECT id, email, name, role, organizationId 
    FROM users 
    WHERE email LIKE '%proagentur%' OR email LIKE '%niaghi%' OR name LIKE '%Niaghi%'
  `);
  console.log('Users:', JSON.stringify(users, null, 2));

  // Alle Organizations
  const [orgs] = await connection.execute(`
    SELECT id, name, customerNumber 
    FROM organizations 
    WHERE name LIKE '%ProAgentur%' OR name LIKE '%proagentur%'
  `);
  console.log('Organizations:', JSON.stringify(orgs, null, 2));

  // OrganizationMembers für diese User
  if (users.length > 0) {
    const userIds = users.map(u => u.id).join(',');
    const [members] = await connection.execute(`
      SELECT om.organizationId, om.userId, om.memberRole, u.email, u.name as userName
      FROM organizationMembers om
      JOIN users u ON om.userId = u.id
      WHERE om.userId IN (${userIds})
    `);
    console.log('OrganizationMembers:', JSON.stringify(members, null, 2));
  }

  await connection.end();
}

main().catch(console.error);
