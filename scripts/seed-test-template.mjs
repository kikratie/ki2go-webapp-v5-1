// Seed-Script für Test-Template "Vertrag prüfen"
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function seedTestTemplate() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Hole die Kategorie "Analysieren & Prüfen" und den Bereich "Recht & Compliance"
    const [categories] = await connection.execute(
      'SELECT id FROM categories WHERE slug = ? LIMIT 1',
      ['analysieren-pruefen']
    );
    const [businessAreas] = await connection.execute(
      'SELECT id FROM businessAreas WHERE slug = ? LIMIT 1',
      ['recht-compliance']
    );
    
    const categoryId = categories[0]?.id || 1;
    const businessAreaId = businessAreas[0]?.id || 4;
    
    // Variablen-Schema für Vertragsprüfung
    const variableSchema = [
      {
        key: "VERTRAGSTYP",
        label: "Vertragstyp",
        type: "select",
        required: true,
        placeholder: "Wählen Sie den Vertragstyp",
        options: ["Mietvertrag", "Arbeitsvertrag", "Kaufvertrag", "Dienstleistungsvertrag", "NDA", "Lizenzvertrag", "Sonstiger"],
        helpText: "Wählen Sie den Typ des zu prüfenden Vertrags",
        displayOrder: 1
      },
      {
        key: "DOKUMENT",
        label: "Vertragsdokument",
        type: "file",
        required: true,
        placeholder: "Laden Sie den Vertrag hoch",
        helpText: "PDF oder DOCX, max. 10 MB",
        fileTypes: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        maxFileSize: 10,
        displayOrder: 2
      },
      {
        key: "FOKUS",
        label: "Besonderer Fokus",
        type: "textarea",
        required: false,
        placeholder: "z.B. Kündigungsfristen, Haftungsklauseln, Datenschutz...",
        helpText: "Optional: Worauf soll besonders geachtet werden?",
        displayOrder: 3
      },
      {
        key: "ROLLE",
        label: "Ihre Rolle",
        type: "select",
        required: true,
        options: ["Auftraggeber", "Auftragnehmer", "Vermieter", "Mieter", "Arbeitgeber", "Arbeitnehmer"],
        helpText: "Aus welcher Perspektive soll der Vertrag geprüft werden?",
        displayOrder: 4
      }
    ];
    
    // Superprompt für Vertragsprüfung
    const superprompt = `Du bist ein erfahrener Rechtsexperte mit Spezialisierung auf Vertragsrecht im deutschsprachigen Raum.

## Aufgabe
Analysiere den folgenden {{VERTRAGSTYP}} aus der Perspektive des {{ROLLE}}.

## Dokument
{{DOKUMENT}}

## Besonderer Fokus
{{FOKUS}}

## Analyse-Struktur

### 1. Zusammenfassung
- Vertragsparteien
- Vertragsgegenstand
- Laufzeit und Kündigungsfristen
- Wesentliche Pflichten beider Parteien

### 2. Risikoanalyse
Identifiziere und bewerte potenzielle Risiken:
- Haftungsklauseln
- Gewährleistung
- Vertragsstrafen
- Gerichtsstand

### 3. Kritische Klauseln
Liste alle Klauseln auf, die:
- Ungewöhnlich oder nachteilig sind
- Rechtlich bedenklich sein könnten
- Nachverhandelt werden sollten

### 4. Fehlende Regelungen
Welche wichtigen Punkte fehlen im Vertrag?

### 5. Empfehlungen
Konkrete Handlungsempfehlungen mit Priorität (Hoch/Mittel/Niedrig).

### 6. Fazit
Gesamtbewertung des Vertrags (Ampelsystem: Grün/Gelb/Rot) mit Begründung.

---
Hinweis: Diese Analyse ersetzt keine rechtliche Beratung durch einen Anwalt.`;

    // Keywords für automatisches Matching
    const keywords = ["vertrag", "prüfen", "analyse", "risiko", "klausel", "mietvertrag", "arbeitsvertrag", "kaufvertrag", "recht", "legal"];
    
    // Prüfe ob Template bereits existiert
    const [existing] = await connection.execute(
      'SELECT id FROM taskTemplates WHERE slug = ?',
      ['vertrag-pruefen']
    );
    
    if (existing.length > 0) {
      console.log('Template "Vertrag prüfen" existiert bereits, wird aktualisiert...');
      await connection.execute(
        `UPDATE taskTemplates SET 
          name = ?, title = ?, description = ?, shortDescription = ?,
          categoryId = ?, businessAreaId = ?, icon = ?, color = ?,
          variableSchema = ?, superprompt = ?, estimatedTimeSavings = ?,
          creditCost = ?, templateStatus = ?, isFeatured = ?,
          documentRequired = ?, documentCount = ?, maxPages = ?,
          documentRelevanceCheck = ?, documentDescription = ?,
          maskingRequired = ?, autoMasking = ?, keywords = ?,
          updatedAt = NOW()
        WHERE slug = ?`,
        [
          'vertrag_pruefen',
          'Vertrag prüfen',
          'Lassen Sie Ihren Vertrag von KI auf rechtliche Risiken, unklare Formulierungen und fehlende Klauseln analysieren. Erhalten Sie konkrete Handlungsempfehlungen.',
          'KI-gestützte Vertragsanalyse mit Risikoerkennung',
          categoryId,
          businessAreaId,
          'FileCheck',
          '#5FBDCE',
          JSON.stringify(variableSchema),
          superprompt,
          45, // 45 Minuten Zeitersparnis
          2, // 2 Credits
          'active',
          1, // Featured
          1, // Dokument erforderlich
          1, // 1 Dokument
          50, // Max 50 Seiten
          1, // Relevanz-Check aktiviert
          'Laden Sie den zu prüfenden Vertrag als PDF oder DOCX hoch.',
          1, // Masking anbieten
          0, // Manuelles Masking
          JSON.stringify(keywords),
          'vertrag-pruefen'
        ]
      );
    } else {
      console.log('Erstelle Template "Vertrag prüfen"...');
      await connection.execute(
        `INSERT INTO taskTemplates (
          slug, name, title, description, shortDescription,
          categoryId, businessAreaId, icon, color,
          variableSchema, superprompt, estimatedTimeSavings,
          creditCost, templateStatus, isFeatured,
          documentRequired, documentCount, maxPages,
          documentRelevanceCheck, documentDescription,
          maskingRequired, autoMasking, keywords,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          'vertrag-pruefen',
          'vertrag_pruefen',
          'Vertrag prüfen',
          'Lassen Sie Ihren Vertrag von KI auf rechtliche Risiken, unklare Formulierungen und fehlende Klauseln analysieren. Erhalten Sie konkrete Handlungsempfehlungen.',
          'KI-gestützte Vertragsanalyse mit Risikoerkennung',
          categoryId,
          businessAreaId,
          'FileCheck',
          '#5FBDCE',
          JSON.stringify(variableSchema),
          superprompt,
          45,
          2,
          'active',
          1,
          1,
          1,
          50,
          1,
          'Laden Sie den zu prüfenden Vertrag als PDF oder DOCX hoch.',
          1,
          0,
          JSON.stringify(keywords)
        ]
      );
    }
    
    console.log('✅ Test-Template "Vertrag prüfen" erfolgreich erstellt/aktualisiert!');
    
  } catch (error) {
    console.error('Fehler:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedTestTemplate();
