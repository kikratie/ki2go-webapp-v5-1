// Seed-Script für Standard-Metaprompt V1
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const STANDARD_METAPROMPT_V1 = `# {{AUFGABE}}

## Deine Rolle
Du bist ein erfahrener {{EXPERTEN_ROLLE}} mit umfassender Expertise in {{FACHGEBIET}}. Du arbeitest präzise, strukturiert und lieferst praxisnahe Ergebnisse.

## Kontext
{{KONTEXT}}

## Aufgabenstellung
{{AUFGABENBESCHREIBUNG}}

## Zu analysierendes Material
{{DOKUMENT}}

## Fokus-Bereiche
{{PRIORITAETEN}}

## Rahmenbedingungen
- Rechtsraum/Region: {{RECHTSRAUM}}
- Sprache: {{SPRACHE}}
- Zielgruppe: {{ZIELGRUPPE}}

## Anforderungen an die Ausgabe
1. **Strukturierte Analyse** - Gliedere deine Antwort in klare Abschnitte
2. **Konkrete Empfehlungen** - Liefere umsetzbare Handlungsvorschläge
3. **Risiko-Bewertung** - Identifiziere potenzielle Probleme und Chancen
4. **Priorisierung** - Ordne Empfehlungen nach Wichtigkeit

## Ausgabeformat
Erstelle einen professionellen Report mit folgender Struktur:

### 1. Executive Summary
- Kernaussagen in 3-5 Sätzen
- Wichtigste Erkenntnisse

### 2. Detaillierte Analyse
- Systematische Durcharbeitung aller relevanten Aspekte
- Begründung der Bewertungen

### 3. Kritische Punkte
- Risiken und Problembereiche
- Dringlichkeit (Hoch/Mittel/Niedrig)

### 4. Handlungsempfehlungen
- Konkrete nächste Schritte
- Verantwortlichkeiten
- Zeitrahmen

### 5. Fazit
- Gesamtbewertung
- Ausblick

## Wichtige Hinweise
- Sei präzise und vermeide vage Formulierungen
- Nutze Fachbegriffe, erkläre sie aber bei Bedarf
- Verweise auf relevante Quellen oder Standards
- Kennzeichne Annahmen deutlich`;

async function seedMetaprompt() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Verbinde mit Datenbank...');
    
    // Prüfe ob bereits ein Metaprompt existiert
    const [existing] = await connection.execute(
      'SELECT id FROM metapromptTemplates WHERE isActive = 1 LIMIT 1'
    );
    
    if (existing.length > 0) {
      console.log('Es existiert bereits ein aktives Metaprompt. Überspringe...');
      return;
    }
    
    // Erstelle Standard-Metaprompt V1
    const [result] = await connection.execute(
      `INSERT INTO metapromptTemplates 
       (name, description, template, version, isDefault, isActive, targetAudience, outputStyle, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'KI2GO Standard Metaprompt V1',
        'Das Standard-Metaprompt für alle KI2GO Aufgaben. Enthält Platzhalter für Aufgabe, Kontext, Dokument, Prioritäten und Ausgabeformat.',
        STANDARD_METAPROMPT_V1,
        1,
        1, // isDefault
        1, // isActive
        'Unternehmen und Geschäftsführer',
        'Professioneller Business-Report',
        1  // createdBy (Owner)
      ]
    );
    
    console.log('✅ Standard-Metaprompt V1 erfolgreich erstellt!');
    console.log(`   ID: ${result.insertId}`);
    console.log('   Name: KI2GO Standard Metaprompt V1');
    console.log('   Status: Aktiv und Standard');
    
    // Zeige die enthaltenen Variablen
    const variables = STANDARD_METAPROMPT_V1.match(/\{\{([A-Z_]+)\}\}/g);
    const uniqueVars = [...new Set(variables)];
    console.log(`   Variablen (${uniqueVars.length}): ${uniqueVars.join(', ')}`);
    
  } catch (error) {
    console.error('Fehler beim Erstellen des Metaprompts:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedMetaprompt().catch(console.error);
