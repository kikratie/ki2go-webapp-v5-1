/**
 * Migration Script: SP-XXX zu OT-XXX und CT-XXX Nummerierung
 * 
 * Dieses Script migriert:
 * 1. taskTemplates.uniqueId von SP-YYYY-XXX zu OT-XXX-V1
 * 2. customSuperprompts.uniqueId zu CT-XXX-KYYYY-XXX-VX
 * 3. customSuperprompts.sourceTemplateUniqueId auf neues OT-Format
 * 4. organizations.customerNumber auf K[Jahr]-[fortlaufend]
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL nicht gesetzt!');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Starte Migration der Template-IDs...\n');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // 1. Kundennummern für alle Organisationen generieren
    console.log('📋 Generiere Kundennummern für Organisationen...');
    const [orgs] = await connection.execute(
      'SELECT id, name, customerNumber, createdAt FROM organizations WHERE customerNumber IS NULL ORDER BY createdAt ASC'
    );
    
    const currentYear = new Date().getFullYear();
    let customerCounter = 1;
    
    // Finde die höchste existierende Kundennummer
    const [existingNumbers] = await connection.execute(
      `SELECT customerNumber FROM organizations WHERE customerNumber IS NOT NULL`
    );
    
    for (const num of existingNumbers) {
      if (num.customerNumber) {
        const match = num.customerNumber.match(/K(\d{4})-(\d+)/);
        if (match && parseInt(match[1]) === currentYear) {
          customerCounter = Math.max(customerCounter, parseInt(match[2]) + 1);
        }
      }
    }
    
    for (const org of orgs) {
      const customerNumber = `K${currentYear}-${String(customerCounter).padStart(3, '0')}`;
      await connection.execute(
        'UPDATE organizations SET customerNumber = ? WHERE id = ?',
        [customerNumber, org.id]
      );
      console.log(`  ✓ ${org.name} → ${customerNumber}`);
      customerCounter++;
    }
    console.log(`  ${orgs.length} Organisationen aktualisiert\n`);
    
    // 2. Owner-Templates (taskTemplates) migrieren
    console.log('📋 Migriere Owner-Templates (SP-XXX → OT-XXX)...');
    const [templates] = await connection.execute(
      'SELECT id, uniqueId, name, templateVersion FROM taskTemplates ORDER BY id ASC'
    );
    
    const templateMapping = {}; // Altes Format → Neues Format
    let templateCounter = 1;
    
    for (const template of templates) {
      const oldId = template.uniqueId;
      const version = template.templateVersion || '1.0';
      const versionNum = version.split('.')[0] || '1';
      const newId = `OT-${String(templateCounter).padStart(3, '0')}-V${versionNum}`;
      
      templateMapping[oldId] = newId;
      templateMapping[template.id] = newId; // Auch Integer-ID mappen
      
      await connection.execute(
        'UPDATE taskTemplates SET uniqueId = ? WHERE id = ?',
        [newId, template.id]
      );
      console.log(`  ✓ ${oldId || `ID:${template.id}`} → ${newId} (${template.name})`);
      templateCounter++;
    }
    console.log(`  ${templates.length} Owner-Templates aktualisiert\n`);
    
    // 3. Custom-Templates migrieren
    console.log('📋 Migriere Custom-Templates (CT-XXX-KYYYY-XXX-VX)...');
    const [customTemplates] = await connection.execute(`
      SELECT 
        cs.id, 
        cs.uniqueId, 
        cs.sourceTemplateUniqueId, 
        cs.baseTemplateId,
        cs.organizationId,
        cs.userId,
        cs.version,
        cs.name,
        o.customerNumber
      FROM customSuperprompts cs
      LEFT JOIN organizations o ON cs.organizationId = o.id
      ORDER BY cs.id ASC
    `);
    
    for (const ct of customTemplates) {
      // Finde das Owner-Template Format
      let ownerTemplateId = templateMapping[ct.sourceTemplateUniqueId] || templateMapping[ct.baseTemplateId];
      
      if (!ownerTemplateId) {
        // Fallback: Hole direkt aus der DB
        const [baseTemplate] = await connection.execute(
          'SELECT uniqueId FROM taskTemplates WHERE id = ?',
          [ct.baseTemplateId]
        );
        ownerTemplateId = baseTemplate[0]?.uniqueId || `OT-${String(ct.baseTemplateId).padStart(3, '0')}-V1`;
      }
      
      // Extrahiere OT-Nummer
      const otMatch = ownerTemplateId.match(/OT-(\d+)/);
      const otNum = otMatch ? otMatch[1] : String(ct.baseTemplateId).padStart(3, '0');
      
      // Kundennummer
      const customerNum = ct.customerNumber || `K${currentYear}-000`;
      const customerNumShort = customerNum.replace('K', '');
      
      // Neue Custom-Template ID
      const newId = `CT-${otNum}-K${customerNumShort}-V${ct.version || 1}`;
      
      // Aktualisiere sourceTemplateUniqueId auf neues OT-Format
      const newSourceId = ownerTemplateId;
      
      await connection.execute(
        'UPDATE customSuperprompts SET uniqueId = ?, sourceTemplateUniqueId = ? WHERE id = ?',
        [newId, newSourceId, ct.id]
      );
      console.log(`  ✓ ${ct.uniqueId || `ID:${ct.id}`} → ${newId}`);
    }
    console.log(`  ${customTemplates.length} Custom-Templates aktualisiert\n`);
    
    // 4. Mapping-Tabelle für Referenz speichern
    console.log('📋 Speichere Mapping-Tabelle...');
    const mappingJson = JSON.stringify(templateMapping, null, 2);
    console.log('  Mapping:', mappingJson.substring(0, 500) + '...\n');
    
    console.log('✅ Migration erfolgreich abgeschlossen!');
    console.log(`
Zusammenfassung:
- ${orgs.length} Organisationen mit Kundennummern versehen
- ${templates.length} Owner-Templates auf OT-Format migriert
- ${customTemplates.length} Custom-Templates auf CT-Format migriert
    `);
    
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch(console.error);
