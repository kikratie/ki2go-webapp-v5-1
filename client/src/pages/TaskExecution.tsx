import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  FileText,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  X,
  Info,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  FileWarning,
  Lightbulb,
  Eye,
  Calculator,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { RoiCalculatorModal } from "@/components/RoiCalculatorModal";

// Dynamisches Icon
const DynamicIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.FileText;
  return <IconComponent className={className} style={style} />;
};

// Variable Schema Typ
interface VariableSchema {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "file";
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: string[];
  example?: string;
  functionDescription?: string;
}

// Uploaded Document Typ
interface UploadedDocument {
  id?: number; // Backend document ID
  name: string;
  url: string;
  size: number;
  type: string;
  isReadable: boolean;
  extractedText?: string;
  extractedTextPreview?: string;
  warning?: string;
}

// Dokument-Analyse Ergebnis
interface DocumentAnalysis {
  isReadable: boolean;
  textLength: number;
  warning?: string;
  extractedInfo?: Record<string, string>;
}

export default function TaskExecution() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  
  // Workflow State
  const [step, setStep] = useState<"documents" | "variables" | "processing" | "result">("documents");
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [executionId, setExecutionId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [showOcrWarning, setShowOcrWarning] = useState(false);
  const [ocrWarningMessage, setOcrWarningMessage] = useState("");
  const [extractedSuggestions, setExtractedSuggestions] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [touchedVariables, setTouchedVariables] = useState<Record<string, boolean>>({});
  const [showRoiCalculator, setShowRoiCalculator] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lade Template-Daten
  const { data: template, isLoading: templateLoading, error: templateError } = 
    trpc.workflow.getTemplateForExecution.useQuery(
      { slug: slug || "" },
      { enabled: !!slug && !!user }
    );

  // Document Upload Mutation
  const uploadDocumentMutation = trpc.document.upload.useMutation({
    onSuccess: (data) => {
      const newDoc: UploadedDocument = {
        id: data.id,
        name: data.fileName,
        url: data.fileUrl,
        size: data.fileSize,
        type: "",
        isReadable: data.isReadable,
        extractedTextPreview: data.extractedText,
      };
      
      setUploadedDocuments(prev => [...prev, newDoc]);
      
      if (!data.isReadable) {
        setOcrWarningMessage("Das Dokument konnte nicht vollständig gelesen werden. Möglicherweise handelt es sich um ein gescanntes PDF.");
        setShowOcrWarning(true);
      }
    },
    onError: (error) => {
      toast.error(`Upload fehlgeschlagen: ${error.message}`);
    },
  });

  // Execute Mutation
  const executeMutation = trpc.workflow.execute.useMutation({
    onSuccess: (data) => {
      setExecutionId(data.executionId);
      setStep("result");
      toast.success("Aufgabe erfolgreich ausgeführt!");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
      setStep("variables");
    },
  });

  // Parse Variable Schema
  const variableSchema: VariableSchema[] = template?.variableSchema 
    ? (typeof template.variableSchema === "string" 
        ? JSON.parse(template.variableSchema) 
        : template.variableSchema)
    : [];

  // Prüfe ob PDF lesbar ist (simuliert OCR-Check)
  const checkPdfReadability = async (file: File): Promise<DocumentAnalysis> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(content);
        
        // Einfache Heuristik: Prüfe ob PDF Text-Streams enthält
        // In Produktion würde hier eine echte PDF-Analyse stattfinden
        const textContent = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        
        // Suche nach Text-Markern in PDF
        const hasTextStreams = textContent.includes('/Type /Page') && 
                              (textContent.includes('BT') && textContent.includes('ET'));
        const hasImages = textContent.includes('/Image') || textContent.includes('/XObject');
        const textLength = textContent.replace(/[^\w\s]/g, '').length;
        
        // Wenn hauptsächlich Bilder und wenig Text -> wahrscheinlich gescannt
        if (hasImages && textLength < 1000 && !hasTextStreams) {
          resolve({
            isReadable: false,
            textLength,
            warning: "Dieses PDF scheint ein gescanntes Dokument zu sein. Der Text kann möglicherweise nicht vollständig extrahiert werden. Für beste Ergebnisse verwenden Sie bitte ein maschinenlesbares PDF oder ein Word-Dokument.",
          });
        } else if (textLength < 500) {
          resolve({
            isReadable: false,
            textLength,
            warning: "Dieses Dokument enthält sehr wenig lesbaren Text. Bitte prüfen Sie, ob es sich um ein Bild-PDF handelt.",
          });
        } else {
          resolve({
            isReadable: true,
            textLength,
          });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Konvertiere File zu Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Entferne den Data-URL-Prefix (data:...;base64,)
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Dokument-Upload Handler mit Backend-Integration
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const maxDocs = template?.documentCount || 5;
    const remainingSlots = maxDocs - uploadedDocuments.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    let successCount = 0;

    try {
      for (const file of filesToUpload) {
        // Validiere Dateityp
        const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`${file.name}: Nur PDF, DOCX und TXT Dateien erlaubt`);
          continue;
        }

        // Validiere Dateigröße (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: Datei zu groß (max. 10MB)`);
          continue;
        }

        try {
          // Konvertiere zu Base64 und lade hoch
          console.log(`[Upload] Converting ${file.name} to Base64...`);
          const base64Data = await fileToBase64(file);
          console.log(`[Upload] Base64 size: ${base64Data.length} chars, uploading...`);
          
          await uploadDocumentMutation.mutateAsync({
            fileName: file.name,
            fileData: base64Data,
            mimeType: file.type,
          });
          
          console.log(`[Upload] ${file.name} uploaded successfully`);
          successCount++;
        } catch (uploadError: any) {
          console.error(`[Upload] Error for ${file.name}:`, uploadError);
          const errorMessage = uploadError?.message || uploadError?.data?.message || 'Unbekannter Fehler';
          toast.error(`${file.name}: ${errorMessage}`);
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} Dokument(e) erfolgreich hochgeladen und analysiert`);
      }
    } catch (error) {
      toast.error("Fehler beim Hochladen");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Dokument entfernen
  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // Vorschläge in Felder übernehmen
  const applySuggestions = () => {
    setVariableValues(prev => {
      const newValues = { ...prev };
      Object.entries(extractedSuggestions).forEach(([key, value]) => {
        // Nur übernehmen wenn Feld noch leer ist
        if (!newValues[key]) {
          newValues[key] = value;
        }
      });
      return newValues;
    });
    setShowSuggestions(false);
    toast.success("Vorschläge wurden übernommen");
  };

  // Weiter zu Variablen
  const proceedToVariables = () => {
    if (template?.documentRequired && uploadedDocuments.length === 0) {
      setShowSkipWarning(true);
    } else {
      setStep("variables");
    }
  };

  // Aufgabe ausführen
  const executeTask = () => {
    if (!template) return;

    // Validiere erforderliche Variablen
    const missingRequired = variableSchema
      .filter(v => v.required)
      .filter(v => !variableValues[v.key]?.trim());

    if (missingRequired.length > 0) {
      toast.error(`Bitte füllen Sie alle Pflichtfelder aus: ${missingRequired.map(v => v.label).join(", ")}`);
      return;
    }

    setStep("processing");
    setProgress(0);

    // Simuliere Progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    // Sammle Document IDs von hochgeladenen Dokumenten
    const documentIds = uploadedDocuments
      .filter(doc => doc.id !== undefined)
      .map(doc => doc.id as number);

    executeMutation.mutate({
      templateId: template.id,
      variables: variableValues,
      documentIds: documentIds.length > 0 ? documentIds : undefined,
    });
  };

  // Generiere erweiterte Feldbeschreibung
  const getFieldDescription = (variable: VariableSchema): string => {
    // Standard-Beschreibungen basierend auf Feldtyp und Namen
    const descriptions: Record<string, string> = {
      vertragsart: "Bestimmt, welche rechtlichen Aspekte besonders geprüft werden (z.B. Mietrecht bei Mietverträgen, Arbeitsrecht bei Arbeitsverträgen).",
      vertragspartei: "Name der anderen Vertragspartei. Wird verwendet, um die Analyse auf die spezifischen Rechte und Pflichten dieser Partei auszurichten.",
      analysefokus: "Legt fest, welche Aspekte des Dokuments besonders detailliert untersucht werden sollen.",
      sprache: "Die Sprache, in der das Ergebnis erstellt werden soll.",
      branche: "Ermöglicht branchenspezifische Empfehlungen und Vergleiche mit Marktstandards.",
      zeitraum: "Der zu analysierende Zeitraum. Beeinflusst die Relevanz historischer Daten.",
      zielgruppe: "Für wen das Ergebnis erstellt wird. Beeinflusst Detailtiefe und Fachsprache.",
      format: "Das gewünschte Ausgabeformat beeinflusst Struktur und Darstellung des Ergebnisses.",
    };

    // Prüfe ob eine Standard-Beschreibung existiert
    const keyLower = variable.key.toLowerCase();
    for (const [key, desc] of Object.entries(descriptions)) {
      if (keyLower.includes(key)) {
        return desc;
      }
    }

    // Fallback: Generiere Beschreibung basierend auf Feldtyp
    if (variable.type === "select") {
      return `Wählen Sie eine Option aus der Liste. Diese Auswahl beeinflusst, wie das Ergebnis strukturiert und fokussiert wird.`;
    }
    if (variable.type === "textarea") {
      return `Beschreiben Sie hier ausführlich Ihre Anforderungen. Je detaillierter Ihre Angaben, desto präziser das Ergebnis.`;
    }
    return `Dieses Feld wird verwendet, um das Ergebnis an Ihre spezifischen Anforderungen anzupassen.`;
  };

  // Generiere Beispiel für Feld
  const getFieldExample = (variable: VariableSchema): string | null => {
    if (variable.example) return variable.example;

    const examples: Record<string, string> = {
      vertragsart: "z.B. Mietvertrag, Arbeitsvertrag, Kaufvertrag",
      vertragspartei: "z.B. Mustermann GmbH, Max Müller",
      email: "z.B. max.mustermann@firma.de",
      telefon: "z.B. +49 123 456789",
      datum: "z.B. 15.03.2026",
      betrag: "z.B. 50.000 EUR",
      name: "z.B. Max Mustermann",
      firma: "z.B. Muster GmbH",
      branche: "z.B. IT, Handel, Produktion",
      zeitraum: "z.B. Q1 2026, Januar - März 2026",
    };

    const keyLower = variable.key.toLowerCase();
    for (const [key, example] of Object.entries(examples)) {
      if (keyLower.includes(key)) {
        return example;
      }
    }
    return null;
  };

  // Loading State
  if (authLoading || templateLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // Nicht angemeldet - zur Vorschau-Seite weiterleiten
  if (!user) {
    navigate(`/aufgabe/${slug}/vorschau`);
    return null;
  }

  // Template nicht gefunden
  if (templateError || !template) {
    return (
      <div className="container max-w-4xl py-16 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive/50 mb-6" />
        <h1 className="text-2xl font-bold mb-4">Aufgabe nicht gefunden</h1>
        <p className="text-muted-foreground mb-8">
          Diese Aufgabe existiert nicht oder Sie haben keinen Zugriff darauf.
        </p>
        <Button variant="outline" onClick={() => navigate("/aufgaben")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Aufgaben
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader 
        title={template.marketingHeadline || template.title} 
        metaDescription={template.marketingMetaDescription || template.shortDescription || undefined}
        metaKeywords={template.marketingKeywords?.length > 0 ? template.marketingKeywords : undefined}
        canonicalUrl={`https://ki2go.at/aufgabe/${template.slug}`}
      />
      <TooltipProvider>
        <div className="container max-w-4xl py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/aufgaben")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-lg"
              style={{ backgroundColor: `${template.color}20` }}
            >
              <DynamicIcon
                name={template.icon || "FileText"}
                className="h-6 w-6"
                style={{ color: template.color ?? undefined }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{template.title}</h1>
              <p className="text-sm text-muted-foreground">{template.shortDescription}</p>
            </div>
          </div>
        </div>

        {/* Marketing Banner - wenn aktiviert */}
        {template.marketingEnabled === 1 && template.marketingHeadline && (
          <div className="mb-8 rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800 p-6 space-y-4">
            {/* Headline */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {template.marketingHeadline}
              </h2>
              {template.marketingSubheadline && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {template.marketingSubheadline}
                </p>
              )}
            </div>

            {/* USPs */}
            {template.marketingUsps && template.marketingUsps.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4">
                {template.marketingUsps.map((usp: string, index: number) => (
                  <div key={index} className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    <span>{usp}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ROI-Anzeige */}
            {template.roiBaseTimeMinutes && (
              <div className="flex flex-wrap items-center justify-center gap-6 pt-3 border-t border-green-200 dark:border-green-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(template.roiBaseTimeMinutes || 30) + (template.roiTimePerDocumentMinutes || 15) - (template.roiKi2goTimeMinutes || 3)} Min.
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Zeitersparnis pro Aufgabe</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    €{Math.round(((template.roiBaseTimeMinutes || 30) + (template.roiTimePerDocumentMinutes || 15) - (template.roiKi2goTimeMinutes || 3)) / 60 * (template.roiHourlyRate || 80))}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Geldersparnis pro Aufgabe</div>
                </div>
                <div className="text-center px-4 py-2 bg-purple-100 dark:bg-purple-950/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    €{Math.round(((template.roiBaseTimeMinutes || 30) + (template.roiTimePerDocumentMinutes || 15) - (template.roiKi2goTimeMinutes || 3)) / 60 * (template.roiHourlyRate || 80) * (template.roiTasksPerMonth || 10) * 12).toLocaleString('de-DE')}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">bei {template.roiTasksPerMonth || 10} Aufgaben/Monat/Jahr</div>
                </div>
              </div>
            )}
            {/* ROI Disclaimer */}
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 text-center italic">
              * Zeitersparnis basiert auf Erfahrungswerten und kann variieren.
            </p>
            {/* ROI-Rechner Button */}
            <Button
              variant="default"
              size="lg"
              className="mt-4 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all border-2 border-orange-400"
              onClick={() => setShowRoiCalculator(true)}
            >
              <Calculator className="h-5 w-5 mr-2" />
              Berechnen Sie Ihren individuellen ROI
            </Button>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {["documents", "variables", "processing", "result"].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? "bg-primary text-primary-foreground"
                    : ["documents", "variables", "processing", "result"].indexOf(step) > i
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              {i < 3 && (
                <div
                  className={`w-12 h-0.5 mx-1 ${
                    ["documents", "variables", "processing", "result"].indexOf(step) > i
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Dokumente */}
        {step === "documents" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Dokumente hochladen
                {template.documentRequired ? (
                  <Badge variant="destructive" className="ml-2">Erforderlich</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2">Optional</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {template.documentDescription || 
                  `Laden Sie bis zu ${template.documentCount || 5} Dokumente hoch, die analysiert werden sollen.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ROI-Banner */}
              {template.roiBaseTimeMinutes && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                      <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Geschätzte Zeitersparnis
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {(() => {
                          const docCount = Math.max(1, uploadedDocuments.length);
                          const manualTime = (template.roiBaseTimeMinutes || 30) + (docCount * (template.roiTimePerDocumentMinutes || 15));
                          const ki2goTime = (template.roiKi2goTimeMinutes || 3) + Math.floor(docCount / 2);
                          const savedTime = manualTime - ki2goTime;
                          const savedMoney = Math.round(savedTime / 60 * (template.roiHourlyRate || 80));
                          return `~${savedTime} Minuten (ca. €${savedMoney}) bei ${docCount} Dokument${docCount > 1 ? 'en' : ''}`;
                        })()}
                      </p>
                    </div>
                    <Badge className="bg-green-600 text-white">
                      {(() => {
                        const docCount = Math.max(1, uploadedDocuments.length);
                        const manualTime = (template.roiBaseTimeMinutes || 30) + (docCount * (template.roiTimePerDocumentMinutes || 15));
                        const ki2goTime = (template.roiKi2goTimeMinutes || 3) + Math.floor(docCount / 2);
                        return `${manualTime} → ${ki2goTime} Min.`;
                      })()}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-green-600/60 dark:text-green-400/60 mt-2 italic">
                    * Zeitersparnis basiert auf Erfahrungswerten
                  </p>
                </div>
              )}

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer hover:border-primary/50 ${
                  isUploading ? "border-primary bg-primary/5" : "border-muted"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading || uploadedDocuments.length >= (template.documentCount || 5)}
                />
                {isUploading ? (
                  <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
                ) : (
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                )}
                <p className="font-medium mb-1">
                  {isUploading ? "Wird hochgeladen..." : "Klicken oder Dateien hierher ziehen"}
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, DOCX oder TXT (max. 10MB pro Datei)
                </p>
              </div>

              {/* Uploaded Files */}
              {uploadedDocuments.length > 0 && (
                <div className="space-y-2">
                  <Label>Hochgeladene Dokumente ({uploadedDocuments.length}/{template.documentCount || 5})</Label>
                  {uploadedDocuments.map((doc, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        doc.isReadable ? "bg-muted/50" : "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {doc.isReadable ? (
                          <FileText className="h-5 w-5 text-primary" />
                        ) : (
                          <FileWarning className="h-5 w-5 text-amber-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(doc.size / 1024).toFixed(1)} KB
                            {!doc.isReadable && (
                              <span className="text-amber-600 dark:text-amber-400 ml-2">
                                • Möglicherweise nicht lesbar
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!doc.isReadable && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-amber-500">
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{doc.warning}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDocument(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Analyse-Status */}
              {isAnalyzing && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-700 dark:text-blue-300">
                      Dokument wird analysiert...
                    </p>
                    <p className="text-blue-600 dark:text-blue-400">
                      Relevante Informationen werden extrahiert, um Felder vorzufüllen.
                    </p>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Hinweise für beste Ergebnisse:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Verwenden Sie maschinenlesbare PDFs (keine gescannten Bilder)</li>
                    <li>Word-Dokumente (.docx) werden am zuverlässigsten verarbeitet</li>
                    {template.maxPages && (
                      <li>Dokumente sollten maximal {template.maxPages} Seiten haben</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => navigate("/aufgaben")}>
                  Abbrechen
                </Button>
                <Button onClick={proceedToVariables}>
                  {template.documentRequired && uploadedDocuments.length === 0 
                    ? "Überspringen" 
                    : "Weiter"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Variablen */}
        {step === "variables" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Angaben zur Aufgabe
              </CardTitle>
              <CardDescription>
                Füllen Sie die folgenden Felder aus, um die Aufgabe zu personalisieren.
                Felder mit <span className="text-destructive">*</span> sind Pflichtfelder.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vorschläge-Banner */}
              {showSuggestions && Object.keys(extractedSuggestions).length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-700 dark:text-green-300 mb-2">
                      Vorschläge aus Ihrem Dokument
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                      Wir haben folgende Informationen aus Ihrem Dokument extrahiert:
                    </p>
                    <div className="space-y-1 mb-3">
                      {Object.entries(extractedSuggestions).map(([key, value]) => (
                        <p key={key} className="text-sm">
                          <span className="font-medium">{key}:</span> {value}
                        </p>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={applySuggestions}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Vorschläge übernehmen
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowSuggestions(false)}>
                        Ignorieren
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {variableSchema.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>Keine weiteren Angaben erforderlich.</p>
                  <p className="text-sm">Sie können die Aufgabe direkt ausführen.</p>
                </div>
              ) : (
                variableSchema.map((variable) => {
                  const fieldDescription = variable.functionDescription || getFieldDescription(variable);
                  const fieldExample = getFieldExample(variable);
                  const value = variableValues[variable.key] || "";
                  const isTouched = touchedVariables[variable.key];
                  const isValid = !variable.required || value.length >= 2;
                  const showValidation = isTouched || value.length > 0;
                  
                  // Validierungs-Klassen
                  const getInputClasses = (baseClass: string) => {
                    if (!showValidation) return baseClass;
                    if (isValid) return `${baseClass} border-green-500 focus:border-green-500 bg-green-50/30`;
                    return `${baseClass} border-amber-500 focus:border-amber-500 bg-amber-50/30`;
                  };
                  
                  return (
                    <div key={variable.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={variable.key} className="text-base">
                          {variable.label}
                          {variable.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {/* Inline-Validierung Icon */}
                        {showValidation && (
                          isValid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-sm">
                            <p className="font-medium mb-1">Was bewirkt dieses Feld?</p>
                            <p className="text-sm">{fieldDescription}</p>
                            {fieldExample && (
                              <p className="text-sm mt-2 text-muted-foreground">
                                <span className="font-medium">Beispiel:</span> {fieldExample}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {variable.type === "textarea" ? (
                        <Textarea
                          id={variable.key}
                          placeholder={variable.placeholder || fieldExample || undefined}
                          value={value}
                          onChange={(e) => setVariableValues(prev => ({
                            ...prev,
                            [variable.key]: e.target.value,
                          }))}
                          onBlur={() => setTouchedVariables(prev => ({ ...prev, [variable.key]: true }))}
                          className={getInputClasses("min-h-[120px] resize-y transition-all")}
                        />
                      ) : variable.type === "select" && variable.options ? (
                        <Select
                          value={value}
                          onValueChange={(val) => {
                            setVariableValues(prev => ({ ...prev, [variable.key]: val }));
                            setTouchedVariables(prev => ({ ...prev, [variable.key]: true }));
                          }}
                        >
                          <SelectTrigger className={getInputClasses("transition-all")}>
                            <SelectValue placeholder={variable.placeholder || "Auswählen..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {variable.options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={variable.key}
                          placeholder={variable.placeholder || fieldExample || undefined}
                          value={value}
                          onChange={(e) => setVariableValues(prev => ({
                            ...prev,
                            [variable.key]: e.target.value,
                          }))}
                          onBlur={() => setTouchedVariables(prev => ({ ...prev, [variable.key]: true }))}
                          className={getInputClasses("transition-all")}
                        />
                      )}
                      
                      {/* Validierungs-Hinweis */}
                      {showValidation && !isValid && variable.required && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Bitte füllen Sie dieses Pflichtfeld aus
                        </p>
                      )}
                      
                      {/* Hilfetext unter dem Feld */}
                      {variable.helpText && (
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <Info className="h-4 w-4 shrink-0 mt-0.5" />
                          {variable.helpText}
                        </p>
                      )}
                      
                      {/* Beispiel wenn kein Hilfetext */}
                      {!variable.helpText && fieldExample && (
                        <p className="text-sm text-muted-foreground">
                          {fieldExample}
                        </p>
                      )}
                    </div>
                  );
                })
              )}

              {/* Uploaded Documents Summary */}
              {uploadedDocuments.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    {uploadedDocuments.length} Dokument(e) werden analysiert:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uploadedDocuments.map((doc, i) => (
                      <Badge key={i} variant={doc.isReadable ? "secondary" : "outline"} className={!doc.isReadable ? "border-amber-300" : ""}>
                        {doc.isReadable ? (
                          <FileText className="h-3 w-3 mr-1" />
                        ) : (
                          <FileWarning className="h-3 w-3 mr-1 text-amber-500" />
                        )}
                        {doc.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep("documents")}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Zurück
                </Button>
                <Button onClick={executeTask} disabled={executeMutation.isPending}>
                  {executeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird ausgeführt...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Aufgabe ausführen
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Processing */}
        {step === "processing" && (
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-6" />
              <h2 className="text-xl font-semibold mb-2">Aufgabe wird ausgeführt...</h2>
              <p className="text-muted-foreground mb-8">
                Bitte warten Sie, während die KI Ihre Anfrage verarbeitet.
              </p>
              <div className="max-w-md mx-auto">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {progress < 30 && "Dokumente werden analysiert..."}
                  {progress >= 30 && progress < 60 && "Informationen werden extrahiert..."}
                  {progress >= 60 && progress < 90 && "Ergebnis wird generiert..."}
                  {progress >= 90 && "Fast fertig..."}
                </p>
              </div>
              <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Geschätzte Zeit: ~{template.estimatedTimeSavings} Minuten gespart</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Result */}
        {step === "result" && executionId && (
          <Card>
            <CardContent className="py-16 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-6" />
              <h2 className="text-xl font-semibold mb-2">Aufgabe abgeschlossen!</h2>
              <p className="text-muted-foreground mb-8">
                Ihr Ergebnis wurde erfolgreich generiert.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => navigate("/aufgaben")}>
                  Weitere Aufgabe
                </Button>
                <Button onClick={() => navigate(`/ergebnis/${executionId}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ergebnis anzeigen
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skip Warning Dialog */}
        <AlertDialog open={showSkipWarning} onOpenChange={setShowSkipWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Dokument erforderlich
              </AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aufgabe erfordert normalerweise ein Dokument zur Analyse. 
                Ohne Dokument können die Ergebnisse möglicherweise nicht so präzise sein.
                <br /><br />
                Möchten Sie trotzdem fortfahren?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Zurück</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowSkipWarning(false);
                setStep("variables");
              }}>
                Trotzdem fortfahren
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* OCR Warning Dialog */}
        <AlertDialog open={showOcrWarning} onOpenChange={setShowOcrWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-amber-500" />
                Dokument möglicherweise nicht lesbar
              </AlertDialogTitle>
              <AlertDialogDescription>
                {ocrWarningMessage}
                <br /><br />
                <strong>Empfehlung:</strong> Für beste Ergebnisse verwenden Sie bitte:
                <ul className="list-disc list-inside mt-2">
                  <li>Ein maschinenlesbares PDF (mit echtem Text, nicht gescannt)</li>
                  <li>Ein Word-Dokument (.docx)</li>
                  <li>Eine Textdatei (.txt)</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                // Entferne das letzte Dokument
                setUploadedDocuments(prev => prev.slice(0, -1));
              }}>
                Dokument entfernen
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => setShowOcrWarning(false)}>
                Trotzdem verwenden
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ROI-Rechner Modal */}
        {template && (
          <RoiCalculatorModal
            open={showRoiCalculator}
            onOpenChange={setShowRoiCalculator}
            defaultValues={{
              hourlyRate: template.roiHourlyRate || 80,
              tasksPerMonth: template.roiTasksPerMonth || 10,
              documentsPerTask: template.documentCount || 1,
              manualBaseTime: template.roiBaseTimeMinutes || 30,
              timePerDocument: template.roiTimePerDocumentMinutes || 15,
              ki2goBaseTime: template.roiKi2goTimeMinutes || 3,
              ki2goTimePerDocument: template.roiKi2goTimePerDocument || 1,
            }}
            sources={template.roiSources || []}
            templateName={template.title}
          />
        )}
        </div>
      </TooltipProvider>
    </>
  );
}
