import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Templates mit DOKUMENT-Variable vom Typ 'file' (nicht textarea)
  const templateIds = [150078, 150101, 150185, 240013];
  
  for (const id of templateIds) {
    const [rows] = await conn.execute('SELECT id, slug, variableSchema FROM taskTemplates WHERE id = ?', [id]);
    if (rows.length === 0) continue;
    
    const row = rows[0];
    let schema = row.variableSchema;
    if (typeof schema === 'string') {
      schema = JSON.parse(schema);
    }
    
    // Entferne DOKUMENT-Variable
    const newSchema = schema.filter(v => v.key !== 'DOKUMENT');
    
    // Aktualisiere displayOrder
    newSchema.forEach((v, i) => {
      v.displayOrder = i;
    });
    
    console.log(`Template ${id} (${row.slug}):`);
    console.log(`  Vorher: ${schema.length} Variablen`);
    console.log(`  Nachher: ${newSchema.length} Variablen`);
    console.log(`  Entfernt: DOKUMENT Variable`);
    
    // Update in DB
    await conn.execute(
      'UPDATE taskTemplates SET variableSchema = ? WHERE id = ?',
      [JSON.stringify(newSchema), id]
    );
    console.log(`  ✅ Aktualisiert`);
    console.log('');
  }
  
  await conn.end();
  console.log('Fertig!');
}

main().catch(console.error);
