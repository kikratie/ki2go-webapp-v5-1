/**
 * Seed-Script für Default-Pläne
 * Erstellt Free, Starter, Business und Enterprise Pläne
 * Alle Preise auf 0 gesetzt (später definierbar)
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL nicht gesetzt');
  process.exit(1);
}

const plans = [
  {
    slug: 'free',
    name: 'Free',
    description: 'Kostenloser Einstieg - ideal zum Testen',
    taskLimit: 10,
    customTemplateLimit: 2,
    storageLimit: 100, // 100 MB
    teamMemberLimit: 1,
    features: JSON.stringify(['basic_templates', 'upload', 'download']),
    priceMonthly: 0,
    priceYearly: 0,
    sortOrder: 1,
    isActive: true,
    isDefault: true, // Wird neuen Usern zugewiesen
  },
  {
    slug: 'starter',
    name: 'Starter',
    description: 'Für Einzelunternehmer und kleine Teams',
    taskLimit: 50,
    customTemplateLimit: 10,
    storageLimit: 1024, // 1 GB
    teamMemberLimit: 1,
    features: JSON.stringify(['basic_templates', 'upload', 'download', 'export_pdf']),
    priceMonthly: 0, // Preis später definieren
    priceYearly: 0,
    sortOrder: 2,
    isActive: true,
    isDefault: false,
  },
  {
    slug: 'business',
    name: 'Business',
    description: 'Für wachsende Teams mit erweiterten Funktionen',
    taskLimit: 500,
    customTemplateLimit: 50,
    storageLimit: 10240, // 10 GB
    teamMemberLimit: 10,
    features: JSON.stringify([
      'basic_templates',
      'upload',
      'download',
      'export_pdf',
      'template_sharing',
      'monitoring',
      'team_management',
      'priority_support'
    ]),
    priceMonthly: 0, // Preis später definieren
    priceYearly: 0,
    sortOrder: 3,
    isActive: true,
    isDefault: false,
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    description: 'Für große Unternehmen mit maximaler Flexibilität',
    taskLimit: 0, // 0 = unlimited
    customTemplateLimit: 0, // 0 = unlimited
    storageLimit: 102400, // 100 GB
    teamMemberLimit: 50,
    features: JSON.stringify([
      'basic_templates',
      'upload',
      'download',
      'export_pdf',
      'template_sharing',
      'monitoring',
      'team_management',
      'priority_support',
      'masking',
      'custom_branding',
      'api_access',
      'sso',
      'dedicated_support'
    ]),
    priceMonthly: 0, // Preis später definieren
    priceYearly: 0,
    sortOrder: 4,
    isActive: true,
    isDefault: false,
  },
];

async function seedPlans() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  console.log('Verbinde mit Datenbank...');
  
  try {
    for (const plan of plans) {
      // Prüfe ob Plan bereits existiert
      const [existing] = await connection.execute(
        'SELECT id FROM plans WHERE slug = ?',
        [plan.slug]
      );
      
      if (existing.length > 0) {
        // Update existierenden Plan
        console.log(`Plan "${plan.name}" existiert bereits, aktualisiere...`);
        await connection.execute(
          `UPDATE plans SET 
            name = ?, description = ?, taskLimit = ?, customTemplateLimit = ?,
            storageLimit = ?, teamMemberLimit = ?, features = ?,
            priceMonthly = ?, priceYearly = ?, sortOrder = ?, isActive = ?, isDefault = ?
          WHERE slug = ?`,
          [
            plan.name, plan.description, plan.taskLimit, plan.customTemplateLimit,
            plan.storageLimit, plan.teamMemberLimit, plan.features,
            plan.priceMonthly, plan.priceYearly, plan.sortOrder, plan.isActive, plan.isDefault,
            plan.slug
          ]
        );
      } else {
        // Erstelle neuen Plan
        console.log(`Erstelle Plan "${plan.name}"...`);
        await connection.execute(
          `INSERT INTO plans (slug, name, description, taskLimit, customTemplateLimit,
            storageLimit, teamMemberLimit, features, priceMonthly, priceYearly,
            sortOrder, isActive, isDefault)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            plan.slug, plan.name, plan.description, plan.taskLimit, plan.customTemplateLimit,
            plan.storageLimit, plan.teamMemberLimit, plan.features,
            plan.priceMonthly, plan.priceYearly, plan.sortOrder, plan.isActive, plan.isDefault
          ]
        );
      }
    }
    
    console.log('\\n✅ Alle Pläne erfolgreich erstellt/aktualisiert!');
    
    // Zeige alle Pläne
    const [allPlans] = await connection.execute(
      'SELECT slug, name, taskLimit, customTemplateLimit, storageLimit, teamMemberLimit, isDefault FROM plans ORDER BY sortOrder'
    );
    
    console.log('\\nAktuelle Pläne:');
    console.table(allPlans);
    
  } catch (error) {
    console.error('Fehler beim Seeden der Pläne:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedPlans().catch(console.error);
