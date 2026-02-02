import { invokeLLM } from "./_core/llm";
import { CATEGORIES, BUSINESS_AREAS, CategoryValue, BusinessAreaValue } from "../shared/const";

export interface IntentResult {
  category: CategoryValue;
  categoryLabel: string;
  businessArea: BusinessAreaValue;
  businessAreaLabel: string;
  confidence: number;
  suggestedTask: string;
  reasoning: string;
  keywords: string[];
}

const INTENT_SYSTEM_PROMPT = `Du bist ein Intent-Erkennungs-System für eine B2B KI-Plattform.
Analysiere die Nutzer-Anfrage und erkenne die Absicht.

KATEGORIEN:
${CATEGORIES.map(c => `- ${c.value}: ${c.label} - ${c.description}`).join('\n')}

UNTERNEHMENSBEREICHE:
${BUSINESS_AREAS.map(b => `- ${b.value}: ${b.label}`).join('\n')}

Antworte IMMER im JSON-Format mit folgender Struktur:
{
  "category": "<category_value>",
  "businessArea": "<business_area_value>",
  "confidence": <0.0-1.0>,
  "suggestedTask": "<kurze Beschreibung der erkannten Aufgabe>",
  "reasoning": "<Begründung für die Erkennung>",
  "keywords": ["<keyword1>", "<keyword2>", ...]
}`;

export async function recognizeIntent(userQuery: string): Promise<IntentResult> {
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: INTENT_SYSTEM_PROMPT },
        { role: "user", content: `Analysiere folgende Anfrage: "${userQuery}"` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "intent_recognition",
          strict: true,
          schema: {
            type: "object",
            properties: {
              category: { 
                type: "string", 
                enum: CATEGORIES.map(c => c.value),
                description: "Die erkannte Kategorie" 
              },
              businessArea: { 
                type: "string", 
                enum: BUSINESS_AREAS.map(b => b.value),
                description: "Der erkannte Unternehmensbereich" 
              },
              confidence: { 
                type: "number", 
                description: "Konfidenz der Erkennung (0.0-1.0)" 
              },
              suggestedTask: { 
                type: "string", 
                description: "Kurze Beschreibung der erkannten Aufgabe" 
              },
              reasoning: { 
                type: "string", 
                description: "Begründung für die Erkennung" 
              },
              keywords: { 
                type: "array", 
                items: { type: "string" },
                description: "Erkannte Schlüsselwörter" 
              }
            },
            required: ["category", "businessArea", "confidence", "suggestedTask", "reasoning", "keywords"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No response from LLM");
    }

    const parsed = JSON.parse(content);
    
    // Labels hinzufügen
    const categoryInfo = CATEGORIES.find(c => c.value === parsed.category);
    const businessAreaInfo = BUSINESS_AREAS.find(b => b.value === parsed.businessArea);

    return {
      ...parsed,
      categoryLabel: categoryInfo?.label || parsed.category,
      businessAreaLabel: businessAreaInfo?.label || parsed.businessArea,
    };
  } catch (error) {
    console.error("[IntentRecognition] Error:", error);
    // Fallback
    return {
      category: "recherche_suche",
      categoryLabel: "Recherche & Suche",
      businessArea: "operations",
      businessAreaLabel: "Operations",
      confidence: 0.5,
      suggestedTask: userQuery,
      reasoning: "Fallback aufgrund eines Fehlers bei der Intent-Erkennung",
      keywords: userQuery.split(" ").slice(0, 5),
    };
  }
}

export async function generateSmartQuestions(
  documentText: string,
  category: CategoryValue,
  businessArea: BusinessAreaValue
): Promise<Array<{ id: string; question: string; type: string; required: boolean }>> {
  try {
    const response = await invokeLLM({
      messages: [
        { 
          role: "system", 
          content: `Du bist ein Assistent, der intelligente Fragen generiert, um fehlende Informationen für eine ${CATEGORIES.find(c => c.value === category)?.label || category}-Aufgabe im Bereich ${BUSINESS_AREAS.find(b => b.value === businessArea)?.label || businessArea} zu sammeln.

Basierend auf dem hochgeladenen Dokument, generiere 3-5 relevante Fragen, die helfen, die Aufgabe besser zu verstehen.

Antworte im JSON-Format:
{
  "questions": [
    { "id": "q1", "question": "...", "type": "text|textarea|select", "required": true|false }
  ]
}`
        },
        { 
          role: "user", 
          content: `Dokument-Inhalt (Auszug):\n${documentText.substring(0, 3000)}\n\nGeneriere relevante Fragen.` 
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "smart_questions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    question: { type: "string" },
                    type: { type: "string", enum: ["text", "textarea", "select"] },
                    required: { type: "boolean" }
                  },
                  required: ["id", "question", "type", "required"],
                  additionalProperties: false
                }
              }
            },
            required: ["questions"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') return [];

    const parsed = JSON.parse(content);
    return parsed.questions || [];
  } catch (error) {
    console.error("[SmartQuestions] Error:", error);
    return [];
  }
}
