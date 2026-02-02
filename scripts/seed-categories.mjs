import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Standard-Kategorien
const categories = [
  { slug: 'analysieren_pruefen', name: 'Analysieren & Prüfen', description: 'Dokumente, Verträge und Daten analysieren und prüfen', icon: 'Search', color: '#5FBDCE', displayOrder: 1 },
  { slug: 'erstellen_kreieren', name: 'Erstellen & Kreieren', description: 'Neue Inhalte, Dokumente und Präsentationen erstellen', icon: 'PenTool', color: '#F97316', displayOrder: 2 },
  { slug: 'schreiben_verfassen', name: 'Schreiben & Verfassen', description: 'Texte, E-Mails und Berichte schreiben', icon: 'FileText', color: '#1E3A5F', displayOrder: 3 },
  { slug: 'recherche_suche', name: 'Recherche & Suche', description: 'Informationen recherchieren und zusammentragen', icon: 'Globe', color: '#10B981', displayOrder: 4 },
  { slug: 'uebersetzen_umwandeln', name: 'Übersetzen & Umwandeln', description: 'Texte übersetzen und Formate umwandeln', icon: 'Languages', color: '#8B5CF6', displayOrder: 5 },
  { slug: 'vergleichen_zusammenfassen', name: 'Vergleichen & Bewerten', description: 'Optionen vergleichen und bewerten', icon: 'Scale', color: '#EC4899', displayOrder: 6 },
  { slug: 'zusammenfassen_erklaeren', name: 'Zusammenfassen & Erklären', description: 'Komplexe Inhalte zusammenfassen und erklären', icon: 'BookOpen', color: '#06B6D4', displayOrder: 7 },
  { slug: 'planen_organisieren', name: 'Planen & Organisieren', description: 'Projekte und Aufgaben planen und organisieren', icon: 'Calendar', color: '#F59E0B', displayOrder: 8 },
];

// Standard-Unternehmensbereiche
const businessAreas = [
  { slug: 'allgemein', name: 'Allgemein', description: 'Allgemeine Aufgaben ohne spezifischen Bereich', icon: 'Building2', displayOrder: 1 },
  { slug: 'sales_vertrieb', name: 'Sales & Vertrieb', description: 'Vertrieb, Kundenakquise und Verkauf', icon: 'TrendingUp', displayOrder: 2 },
  { slug: 'marketing_pr', name: 'Marketing & PR', description: 'Marketing, Werbung und Öffentlichkeitsarbeit', icon: 'Megaphone', displayOrder: 3 },
  { slug: 'legal_recht', name: 'Recht & Compliance', description: 'Rechtliche Angelegenheiten und Compliance', icon: 'Scale', displayOrder: 4 },
  { slug: 'hr_recruiting', name: 'HR & Recruiting', description: 'Personal, Recruiting und Mitarbeiterentwicklung', icon: 'Users', displayOrder: 5 },
  { slug: 'einkauf_finanzen', name: 'Finanzen & Einkauf', description: 'Finanzen, Buchhaltung und Einkauf', icon: 'Euro', displayOrder: 6 },
  { slug: 'management_strategie', name: 'Management & Strategie', description: 'Unternehmensführung und strategische Planung', icon: 'Target', displayOrder: 7 },
  { slug: 'customer_success', name: 'Customer Success', description: 'Kundenbetreuung und Kundenerfolg', icon: 'HeartHandshake', displayOrder: 8 },
  { slug: 'growth_leadgen', name: 'Growth & Lead-Gen', description: 'Wachstum und Lead-Generierung', icon: 'Rocket', displayOrder: 9 },
  { slug: 'projektmanagement', name: 'Projektmanagement', description: 'Projektplanung und -steuerung', icon: 'Kanban', displayOrder: 10 },
  { slug: 'operations', name: 'Operations & IT', description: 'Betrieb, IT und Infrastruktur', icon: 'Settings', displayOrder: 11 },
];

console.log('Seeding categories...');
for (const cat of categories) {
  try {
    await connection.execute(
      `INSERT INTO categories (slug, name, description, icon, color, displayOrder, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), icon = VALUES(icon), color = VALUES(color)`,
      [cat.slug, cat.name, cat.description, cat.icon, cat.color, cat.displayOrder]
    );
    console.log(`  ✓ ${cat.name}`);
  } catch (err) {
    console.log(`  ✗ ${cat.name}: ${err.message}`);
  }
}

console.log('\\nSeeding business areas...');
for (const area of businessAreas) {
  try {
    await connection.execute(
      `INSERT INTO businessAreas (slug, name, description, icon, displayOrder, isActive) 
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), icon = VALUES(icon)`,
      [area.slug, area.name, area.description, area.icon, area.displayOrder]
    );
    console.log(`  ✓ ${area.name}`);
  } catch (err) {
    console.log(`  ✗ ${area.name}: ${err.message}`);
  }
}

console.log('\\n✅ Seeding completed!');
await connection.end();
