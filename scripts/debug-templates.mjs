import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute(`
    SELECT uniqueId, title, variableSchema, superprompt, documentRequired
    FROM taskTemplates 
    WHERE uniqueId IN ('SP-2026-001', 'SP-2026-003', 'SP-2026-004', 'SP-2026-006', 'SP-2026-007')
       OR title = 'Vertrag prüfen'
    ORDER BY uniqueId
  `);
  
  for (const r of rows) {
    console.log('\n' + '='.repeat(80));
    console.log(`TEMPLATE: ${r.uniqueId || 'NULL'} - ${r.title}`);
    console.log(`Document Required: ${r.documentRequired}`);
    console.log('='.repeat(80));
    
    // Parse variableSchema
    let vars = [];
    try {
      if (typeof r.variableSchema === 'string') {
        vars = JSON.parse(r.variableSchema || '[]');
      } else if (Array.isArray(r.variableSchema)) {
        vars = r.variableSchema;
      } else if (r.variableSchema && typeof r.variableSchema === 'object') {
        vars = Object.values(r.variableSchema);
      }
    } catch(e) {
      console.log('FEHLER beim Parsen von variableSchema:', e.message);
      console.log('Type:', typeof r.variableSchema);
    }
    
    console.log(`\nVariablen (${vars.length}):`);
    vars.forEach((v, i) => {
      console.log(`  ${i+1}. ${v.key} (${v.type}) - ${v.label} [required: ${v.required}]`);
    });
    
    // Prüfe ob Variablen im Superprompt verwendet werden
    console.log('\nVariablen im Superprompt:');
    const superpromptVars = (r.superprompt || '').match(/\{\{[^}]+\}\}/g) || [];
    const uniqueVars = [...new Set(superpromptVars)];
    console.log('  Gefunden:', uniqueVars.join(', ') || 'KEINE');
    
    // Vergleiche
    const schemaKeys = vars.map(v => '{{' + v.key + '}}');
    const missingInSchema = uniqueVars.filter(v => schemaKeys.indexOf(v) === -1);
    const missingInPrompt = schemaKeys.filter(k => uniqueVars.indexOf(k) === -1);
    
    if (missingInSchema.length > 0) {
      console.log('  ⚠️ Im Prompt aber NICHT im Schema:', missingInSchema.join(', '));
    }
    if (missingInPrompt.length > 0) {
      console.log('  ⚠️ Im Schema aber NICHT im Prompt:', missingInPrompt.join(', '));
    }
    if (missingInSchema.length === 0 && missingInPrompt.length === 0) {
      console.log('  ✅ Alle Variablen stimmen überein');
    }
  }
  
  await conn.end();
}

main().catch(console.error);
